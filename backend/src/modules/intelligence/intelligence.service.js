// Responsibility: Orchestrate the full readiness pipeline —
//   read all pillar signals (legacy, SELECT-only) -> build composite snapshot (pure)
//   -> persist (new table).
// Layer: Intelligence (Layer 1) service.
// Depends on: intelligence.repository (legacy read), snapshot.builder (pure),
//   snapshot.repository (new-table read/write).
// Must never be depended on by: any existing/legacy module.

const legacyRepo = require("./intelligence.repository");
const snapshotRepo = require("./snapshot.repository");
const { buildSnapshot } = require("./snapshot.builder");

/**
 * Recompute and persist the latest readiness snapshot for one cadet.
 * @param {string} regimentalNo
 * @param {{referenceDate?:(Date|string)}} [options]
 */
async function recomputeCadet(regimentalNo, options = {}) {
  const identity = await legacyRepo.getCadetIdentity(regimentalNo);
  const userId = identity ? identity.userId : null;
  const rankId = identity ? identity.rankId : null;

  const [
    attendanceObservations,
    quizAttempts,
    fines,
    meetings,
    communityEvents,
    leadershipInputs,
  ] = await Promise.all([
    legacyRepo.getAttendanceObservations(regimentalNo),
    legacyRepo.getQuizAttempts(userId),
    legacyRepo.getFines(regimentalNo),
    legacyRepo.getMeetingAttendance(userId),
    legacyRepo.getCommunityEventCount(userId),
    legacyRepo.getLeadershipInputs(regimentalNo, userId, rankId),
  ]);

  const snapshot = buildSnapshot({
    regimentalNo,
    collegeId: identity ? identity.collegeId : null,
    referenceDate: options.referenceDate,
    attendanceObservations,
    quizAttempts,
    fines,
    meetings,
    communityEvents,
    leadership: {
      ...leadershipInputs,
      joiningYear: identity ? identity.joiningYear : null,
    },
  });

  return snapshotRepo.insertSnapshot(snapshot);
}

/**
 * Read the latest persisted snapshot for a cadet (or null if none yet).
 * @param {string} regimentalNo
 */
async function getCadetReadiness(regimentalNo) {
  return snapshotRepo.getLatestByCadet(regimentalNo);
}

module.exports = { recomputeCadet, getCadetReadiness };
