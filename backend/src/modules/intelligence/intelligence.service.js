// Responsibility: Orchestrate the attendance readiness pipeline —
//   read observations (legacy, SELECT-only) -> build snapshot (pure) -> persist (new table).
// Layer: Intelligence (Layer 1) service.
// Depends on: intelligence.repository (legacy read), snapshot.builder (pure),
//   snapshot.repository (new-table read/write).
// Must never be depended on by: any existing/legacy module.

const legacyRepo = require("./intelligence.repository");
const snapshotRepo = require("./snapshot.repository");
const { buildSnapshot } = require("./snapshot.builder");

/**
 * Recompute and persist the latest attendance snapshot for one cadet.
 * @param {string} regimentalNo
 * @param {{referenceDate?:(Date|string)}} [options]
 */
async function recomputeCadet(regimentalNo, options = {}) {
  const [observations, collegeId] = await Promise.all([
    legacyRepo.getAttendanceObservations(regimentalNo),
    legacyRepo.getCadetCollegeId(regimentalNo),
  ]);

  const snapshot = buildSnapshot({
    regimentalNo,
    collegeId,
    observations,
    referenceDate: options.referenceDate,
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
