const db = require("../db/knex");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendMail } = require("../utils/mailer");

/**
 * POST /cadets
 */
const addCadet = async (req, res) => {
  const anoUserId = req.user.user_id;

  const {
    full_name,
    email,
    regimental_no,
    role_name, // Cadet / SUO
    rank_id,
    joining_year,
    dob,
  } = req.body;

  if (!full_name || !email || !regimental_no || !role_name || !rank_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await db.transaction(async (trx) => {
      // 1️⃣ Get ANO college
      const ano = await trx("users")
        .where({ user_id: anoUserId, role: "ANO" })
        .first();

      if (!ano) throw new Error("Unauthorized");

      // 2️⃣ Generate temp password
      const tempPassword = crypto.randomBytes(4).toString("hex");
      const password_hash = await bcrypt.hash(tempPassword, 10);

      // 3️⃣ Create user
      const [user] = await trx("users")
        .insert({
          username: full_name,
          email,
          password_hash,
          role: "CADET",
          college_id: ano.college_id,
        })
        .returning("*");

      // 4️⃣ Cadet profile
      await trx("cadet_profiles").insert({
        regimental_no,
        user_id: user.user_id,
        full_name,
        email,
        dob,
        joining_year,
        college_id: ano.college_id,
        rank_id,
      });

      // 5️⃣ Resolve designation
      const designation = await trx("cadet_designations")
        .where({ name: role_name })
        .first();

      if (!designation) throw new Error("Invalid role");

      // 6️⃣ Insert role history
      await trx("cadet_roles").insert({
        regimental_no,
        designation_id: designation.id,
        start_date: new Date(),
      });

      // 7️⃣ Send email
      await sendMail({
        to: email,
        subject: "NCC Nexus Login Credentials",
        html: `
          <h3>Welcome to NCC Nexus</h3>
          <p><b>Regimental No:</b> ${regimental_no}</p>
          <p><b>Temporary Password:</b> ${tempPassword}</p>
          <p>Please reset your password after login.</p>
        `,
      });
    });

    return res.json({ message: "Cadet added successfully" });
  } catch (err) {
    console.error("Add Cadet Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /cadets
 */
const getCadets = async (req, res) => {
  const anoUserId = req.user.user_id;

  try {
    const ano = await db("users")
      .where({ user_id: anoUserId })
      .first();

    const cadets = await db("cadet_profiles as cp")
      .join("users as u", "u.user_id", "cp.user_id")
      .join("colleges as c", "c.college_id", "cp.college_id")
      .join("cadet_ranks as r", "r.id", "cp.rank_id")
      .leftJoin("cadet_roles as cr", "cr.regimental_no", "cp.regimental_no")
      .leftJoin("cadet_designations as d", "d.id", "cr.designation_id")
      .where("cp.college_id", ano.college_id)
      .select(
        "cp.regimental_no",
        "cp.full_name",
        "cp.email",
        "r.rank_name",
        "d.name as role",
        "c.short_name as unit"
      );

    return res.json(cadets);
  } catch (err) {
    console.error("Get Cadets Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /cadets/:regimental_no
 */
const updateCadet = async (req, res) => {
  const { regimental_no } = req.params;
  const { full_name, email, rank_id, role_name } = req.body;

  try {
    await db.transaction(async (trx) => {
      await trx("cadet_profiles")
        .where({ regimental_no })
        .update({ full_name, email, rank_id });

      if (role_name) {
        const designation = await trx("cadet_designations")
          .where({ name: role_name })
          .first();

        await trx("cadet_roles")
          .where({ regimental_no, end_date: null })
          .update({ end_date: new Date() });

        await trx("cadet_roles").insert({
          regimental_no,
          designation_id: designation.id,
          start_date: new Date(),
        });
      }
    });

    return res.json({ message: "Cadet updated successfully" });
  } catch (err) {
    console.error("Update Cadet Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /cadets/:regimental_no
 */
const deleteCadet = async (req, res) => {
  const { regimental_no } = req.params;

  try {
    const cadet = await db("cadet_profiles")
      .where({ regimental_no })
      .first();

    if (!cadet) {
      return res.status(404).json({ message: "Cadet not found" });
    }

    await db("users")
      .where({ user_id: cadet.user_id })
      .del();

    return res.json({ message: "Cadet deleted successfully" });
  } catch (err) {
    console.error("Delete Cadet Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /cadets/search?q=
 */
const searchCadets = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const ano = await db("users")
      .where({ user_id: req.user.user_id })
      .first();

    const cadets = await db("cadet_profiles as cp")
      .join("users as u", "u.user_id", "cp.user_id")
      .join("cadet_ranks as cr", "cr.id", "cp.rank_id")
      .join("colleges as c", "c.college_id", "cp.college_id")
      .leftJoin("cadet_roles as cro", function () {
        this.on("cro.regimental_no", "cp.regimental_no").andOnNull(
          "cro.end_date"
        );
      })
      .leftJoin("cadet_designations as cd", "cd.id", "cro.designation_id")
      .where("cp.college_id", ano.college_id)
      .andWhere(function () {
        this.whereILike("cp.full_name", `%${q}%`)
          .orWhereILike("cp.email", `%${q}%`)
          .orWhereILike("cp.regimental_no", `%${q}%`)
          .orWhereILike("c.short_name", `%${q}%`);
      })
      .select(
        "cp.regimental_no",
        "cp.full_name",
        "cp.email",
        "cr.rank_name",
        "cd.name as role",
        "c.short_name as unit"
      );

    return res.json(cadets);
  } catch (err) {
    console.error("Search Cadets Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addCadet,
  getCadets,
  updateCadet,
  deleteCadet,
  searchCadets,
};
