// Responsibility: Golden unit tests for the pure snapshot builder (no DB).
// Layer: Intelligence (Layer 1) test.
// Depends on: modules/intelligence/snapshot.builder.
// Must never be depended on by: anything (test file).

const { buildSnapshot } = require("../src/modules/intelligence/snapshot.builder");

const REF = "2026-07-15";

function presentSeries(n, end = REF) {
  const endMs = new Date(end).getTime();
  return Array.from({ length: n }, (_, i) => ({
    drillDate: new Date(endMs - (n - 1 - i) * 7 * 86400000).toISOString().slice(0, 10),
    status: "P",
    approvedLeave: false,
  }));
}

describe("snapshot.builder", () => {
  test("wraps attendance score into a persistable snapshot shape", () => {
    const snap = buildSnapshot({
      regimentalNo: "R1",
      collegeId: 7,
      observations: presentSeries(6),
      referenceDate: REF,
    });

    expect(snap.regimental_no).toBe("R1");
    expect(snap.college_id).toBe(7);
    expect(snap.profile).toBe("general");
    expect(snap.overall_score).toBe(100);
    expect(snap.overall_confidence).toBe(1);
    expect(snap.pillars.attendance.pillar).toBe("attendance");
    expect(snap.pillars.attendance.explanation).toEqual(expect.any(String));
  });

  test("no observations => overall null score + zero confidence (fairness rule)", () => {
    const snap = buildSnapshot({ regimentalNo: "R2", collegeId: null, observations: [] });
    expect(snap.overall_score).toBeNull();
    expect(snap.overall_confidence).toBe(0);
    expect(snap.college_id).toBeNull();
    expect(snap.pillars.attendance.trend).toBe("insufficient_data");
  });
});
