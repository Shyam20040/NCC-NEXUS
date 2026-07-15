// Responsibility: Read-only data access for the Intelligence Layer. Fetches
//   the raw operational signals (starting with attendance) that scorers consume.
// Layer: Intelligence (Layer 1) — the ONLY place that touches existing tables.
// Depends on: db/knex (existing Postgres connection) and the frozen legacy
//   tables attendance_records, attendance_drills, leaves (SELECT only).
// Must never be depended on by: any existing/legacy module. New only.
// INVARIANT: this file issues SELECT queries exclusively — never INSERT/UPDATE/DELETE.

const db = require("../../db/knex");

/**
 * Return the ordered attendance observations for one cadet.
 *
 * Each observation is one drill the cadet has an attendance record for:
 *   { drillId, drillDate, status: 'P' | 'A', approvedLeave: boolean }
 * `approvedLeave` is true when an approved leave exists for that (cadet, drill),
 * so the attendance scorer can treat it as excused (neutral) rather than absent.
 *
 * Soft-deleted drills (attendance_drills.deleted_at IS NOT NULL) are excluded.
 * Ordered oldest → newest so downstream recency weighting is straightforward.
 *
 * @param {string} regimentalNo
 * @returns {Promise<Array<{drillId:number, drillDate:(Date|string), status:string, approvedLeave:boolean}>>}
 */
async function getAttendanceObservations(regimentalNo) {
  const rows = await db("attendance_records as ar")
    .join("attendance_drills as ad", "ad.drill_id", "ar.drill_id")
    .leftJoin("leaves as l", function joinApprovedLeave() {
      this.on("l.regimental_no", "=", "ar.regimental_no")
        .andOn("l.drill_id", "=", "ar.drill_id")
        .andOnVal("l.status", "=", "approved");
    })
    .where("ar.regimental_no", regimentalNo)
    .whereNull("ad.deleted_at")
    .orderBy("ad.drill_date", "asc")
    .select(
      "ar.drill_id as drillId",
      "ad.drill_date as drillDate",
      "ar.status as status",
      db.raw('(l.leave_id IS NOT NULL) as "approvedLeave"')
    );

  return rows.map((r) => ({
    drillId: r.drillId,
    drillDate: r.drillDate,
    status: r.status,
    // Normalize the boolean across pg driver / raw-expression return shapes.
    approvedLeave: r.approvedLeave === true || r.approvedLeave === "t" || r.approvedLeave === 1,
  }));
}

module.exports = { getAttendanceObservations };
