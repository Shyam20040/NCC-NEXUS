// Responsibility: Orchestrate at-risk detection over a college — assess the cohort
//   (pure), reconcile against persisted flags, and expose flag lifecycle actions.
// Layer: Decision Support (Layer 2) service. Depends DOWNWARD on the Intelligence
//   layer's read output; never the reverse.
// Depends on: intelligence.service (cohort read), decision.repository (new table),
//   recipes/atRisk (pure).
// Must never be depended on by: legacy modules or the Intelligence layer.

const intelligenceService = require("../intelligence/intelligence.service");
const decisionRepo = require("./decision.repository");
const { assessRisk } = require("./recipes/atRisk");

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, none: 3 };

/**
 * Pure: run the at-risk recipe across a cohort and return only at-risk cadets,
 * sorted by severity (high first) then by ascending readiness.
 * @param {Array<object>} cohort output of intelligenceService.getCollegeReadiness
 */
function assessCohort(cohort = []) {
  const out = [];
  for (const c of cohort) {
    if (!c.has_snapshot) continue;
    const risk = assessRisk({
      overall_score: c.overall_score,
      overall_confidence: c.overall_confidence,
      pillars: c.pillars,
    });
    if (risk.atRisk) {
      out.push({
        regimental_no: c.regimental_no,
        full_name: c.full_name,
        rank_name: c.rank_name,
        overall_score: c.overall_score,
        ...risk,
      });
    }
  }
  out.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.overall_score ?? 101) - (b.overall_score ?? 101)
  );
  return out;
}

/**
 * Pure: diff the current at-risk list against persisted open/acknowledged flags.
 * @returns {{toInsert:Array, toUpdate:Array<{id:number, risk:object}>, toResolve:Array}}
 */
function reconcilePlan(atRisk = [], activeFlags = []) {
  const flagByReg = new Map(activeFlags.map((f) => [f.regimental_no, f]));
  const atRiskRegs = new Set(atRisk.map((a) => a.regimental_no));

  const toInsert = [];
  const toUpdate = [];
  const toResolve = [];

  for (const a of atRisk) {
    const existing = flagByReg.get(a.regimental_no);
    if (existing) toUpdate.push({ id: existing.id, risk: a });
    else toInsert.push(a);
  }
  for (const f of activeFlags) {
    if (!atRiskRegs.has(f.regimental_no)) toResolve.push(f);
  }
  return { toInsert, toUpdate, toResolve };
}

/** Live at-risk list for a college (computed from latest snapshots, not persisted). */
async function getCollegeRisk(collegeId) {
  const cohort = await intelligenceService.getCollegeReadiness(collegeId);
  return assessCohort(cohort);
}

/** Compute + reconcile persisted flags for a college; emit a transient socket event. */
async function scanCollege(collegeId, { io } = {}) {
  const atRisk = await getCollegeRisk(collegeId);
  const activeFlags = await decisionRepo.listActiveByCollege(collegeId);
  const plan = reconcilePlan(atRisk, activeFlags);

  for (const a of plan.toInsert) {
    await decisionRepo.insertFlag({
      regimental_no: a.regimental_no,
      college_id: collegeId,
      severity: a.severity,
      drivers: a.drivers,
      recommendedAction: a.recommendedAction,
      explanation: a.explanation,
      dataConfidence: a.dataConfidence,
    });
  }
  for (const u of plan.toUpdate) {
    await decisionRepo.updateFlag(u.id, {
      severity: u.risk.severity,
      drivers: u.risk.drivers,
      recommendedAction: u.risk.recommendedAction,
      explanation: u.risk.explanation,
      dataConfidence: u.risk.dataConfidence,
    });
  }
  for (const f of plan.toResolve) {
    await decisionRepo.resolveFlag(f.id);
  }

  // Transient real-time push (no DB write => contract-safe). Best-effort.
  if (io) {
    try {
      io.to(`college_${collegeId}`).emit("risk:updated", {
        collegeId,
        atRiskCount: atRisk.length,
      });
    } catch {
      /* socket emit is best-effort */
    }
  }

  return {
    atRisk: atRisk.length,
    inserted: plan.toInsert.length,
    updated: plan.toUpdate.length,
    resolved: plan.toResolve.length,
  };
}

/** Persisted active flags (open + acknowledged) for a college. */
async function listFlags(collegeId) {
  return decisionRepo.listActiveByCollege(collegeId);
}

/** Acknowledge a flag, enforcing that it belongs to the caller's college. */
async function acknowledgeFlag(id, collegeId, userId) {
  const flagCollege = await decisionRepo.getFlagCollege(id);
  if (flagCollege == null || Number(flagCollege) !== Number(collegeId)) {
    const err = new Error("Flag not found");
    err.status = 404;
    throw err;
  }
  return decisionRepo.acknowledgeFlag(id, userId);
}

module.exports = {
  assessCohort,
  reconcilePlan,
  getCollegeRisk,
  scanCollege,
  listFlags,
  acknowledgeFlag,
};
