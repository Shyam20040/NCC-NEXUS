// Responsibility: Pure composition of pillar scores into a readiness-snapshot object.
// Layer: Intelligence (Layer 1) — pure function, NO I/O, NO DB.
// Depends on: scoring/attendance.scorer (pure). (M2 = attendance only.)
// Must never be depended on by: legacy modules, or the Decision/Adjutant layers.
//
// Kept separate from intelligence.service.js (which does DB I/O) so this stays
// unit-testable without a database.

const { scoreAttendance } = require("./scoring/attendance.scorer");

/**
 * Build a snapshot row (not yet persisted) from raw inputs.
 * For M2 the only pillar is attendance, so the overall score/confidence mirror it.
 *
 * @param {{regimentalNo:string, collegeId:(number|null), observations:Array, referenceDate?:(Date|string)}} input
 * @returns {{regimental_no:string, college_id:(number|null), profile:string,
 *            overall_score:(number|null), overall_confidence:number, pillars:object}}
 */
function buildSnapshot({ regimentalNo, collegeId, observations, referenceDate }) {
  const attendance = scoreAttendance(observations, referenceDate ? { referenceDate } : {});

  return {
    regimental_no: regimentalNo,
    college_id: collegeId ?? null,
    profile: "general",
    overall_score: attendance.score,
    overall_confidence: attendance.confidence,
    pillars: { attendance },
  };
}

module.exports = { buildSnapshot };
