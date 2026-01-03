const db = require("../db/knex");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

const anoLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db("users")
      .where({ email, role: "ANO" })
      .first();

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      user_id: user.user_id,
      role: "ANO",
    });

    return res.json({
      message: "ANO login successful",
      token,
      user: {
        user_id: user.user_id,
        role: "ANO",
        email: user.email,
      },
    });
  } catch (err) {
    console.error("ANO Login Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const cadetLogin = async (req, res) => {
  const { regimental_no, password } = req.body;

  try {
    const cadet = await db("cadet_profiles as cp")
      .join("users as u", "cp.user_id", "u.user_id")
      .where("cp.regimental_no", regimental_no)
      .select(
        "u.user_id",
        "u.password_hash",
        "u.role",
        "cp.full_name"
      )
      .first();

    if (!cadet) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, cadet.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const designation = await db("cadet_roles as cr")
      .join("cadet_designations as cd", "cr.designation_id", "cd.id")
      .where("cr.regimental_no", regimental_no)
      .whereNull("cr.end_date")
      .select("cd.name")
      .first();

    const token = generateToken({
      user_id: cadet.user_id,
      role: cadet.role,
      designation: designation?.name || "Cadet",
      regimental_no,
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        regimental_no,
        role: cadet.role,
        designation: designation?.name || "Cadet",
        name: cadet.full_name,
      },
    });
  } catch (err) {
    console.error("Cadet Login Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const resetPasswordLoggedIn = async (req, res) => {
  const userId = req.user.user_id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  try {
    const user = await db("users")
      .where({ user_id: userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Current password incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db("users")
      .where({ user_id: userId })
      .update({ password_hash: newHash });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  anoLogin,
  cadetLogin,
  resetPasswordLoggedIn,
};
