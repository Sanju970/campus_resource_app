// routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

/* ============================================================
   ADMIN: FETCH USERS
============================================================ */
router.get("/admin/users", async (req, res) => {
  try {
    const includeAll = req.query.all === "true";

    const sql = includeAll
      ? `SELECT user_id, first_name, last_name, user_uid, email, role_id, is_active FROM users`
      : `SELECT user_id, first_name, last_name, user_uid, email, role_id, is_active 
         FROM users WHERE is_active = TRUE`;

    const [rows] = await db.query(sql);

    return res.json(
      rows.map((row) => ({ ...row, is_active: !!row.is_active }))
    );
  } catch (err) {
    console.error("Fetch users error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

/* ============================================================
   ADMIN: CREATE USER
============================================================ */
router.post("/admin/create", async (req, res) => {
  try {
    const { first_name, last_name, user_uid, password, role_id } = req.body;

    if (!first_name || !last_name || !user_uid)
      return res.status(400).json({ message: "Missing required fields" });

    const cleanUid = user_uid.trim().toLowerCase();
    const uidPattern = /^(stu|fac|adm)\d{4,5}$/;

    if (!uidPattern.test(cleanUid))
      return res.status(400).json({
        message: "Invalid User ID. Must be stu/fac/adm + 4–5 digits.",
      });

    let autoRole =
      cleanUid.startsWith("stu")
        ? 1
        : cleanUid.startsWith("fac")
        ? 2
        : 3;

    if (autoRole !== Number(role_id))
      return res.status(400).json({
        message: "Role does not match User UID prefix.",
      });

    const email = `${cleanUid}@campus.edu`;

    const [exists] = await db.query(
      "SELECT user_id FROM users WHERE user_uid = ? OR email = ?",
      [cleanUid, email]
    );

    if (exists.length > 0)
      return res.status(400).json({
        message: "User UID or Email already exists.",
      });

    let plainPassword = password?.trim();

    const strong =
      plainPassword &&
      plainPassword.length >= 8 &&
      /[A-Z]/.test(plainPassword) &&
      /[a-z]/.test(plainPassword) &&
      /[0-9]/.test(plainPassword) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(plainPassword);

    if (plainPassword && !strong)
      return res.status(400).json({
        message:
          "Password must be 8+ chars, with uppercase, lowercase, number & symbol.",
      });

    if (!plainPassword)
      plainPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    const hashed = await bcrypt.hash(plainPassword, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      first_name.trim(),
      last_name.trim(),
      cleanUid,
      email,
      hashed,
      autoRole,
    ]);

    return res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: result.insertId,
        first_name,
        last_name,
        user_uid: cleanUid,
        email,
        role_id: autoRole,
        dummy_password: plainPassword,
      },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   ADMIN: DEACTIVATE USER (soft delete)
============================================================ */
router.patch("/admin/users/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_user_id } = req.body;

    if (Number(id) === Number(admin_user_id))
      return res.status(400).json({
        message: "You cannot deactivate your own account.",
      });

    const [result] = await db.query(
      "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE user_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error("Deactivate user error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

/* ============================================================
   ADMIN: REACTIVATE USER
============================================================ */
router.patch("/admin/users/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE user_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User reactivated" });
  } catch (err) {
    console.error("Reactivate user error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

/* ============================================================
   ADMIN: UPDATE USER
============================================================ */
router.patch("/admin/users/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, user_uid } = req.body;

    if (!first_name || !last_name || !user_uid)
      return res.status(400).json({ message: "All fields are required." });

    const cleanUid = user_uid.trim().toLowerCase();
    const uidPattern = /^(stu|fac|adm)\d{4,5}$/;

    if (!uidPattern.test(cleanUid))
      return res.status(400).json({
        message: "Invalid UID format.",
      });

    const cleanEmail = `${cleanUid}@campus.edu`;

    const [exists] = await db.query(
      `SELECT user_id FROM users WHERE (user_uid = ? OR email = ?) AND user_id != ?`,
      [cleanUid, cleanEmail, id]
    );

    if (exists.length > 0)
      return res.status(400).json({
        message: "Duplicate user_uid or email.",
      });

    let role_id =
      cleanUid.startsWith("stu")
        ? 1
        : cleanUid.startsWith("fac")
        ? 2
        : 3;

    const sql = `
      UPDATE users
      SET first_name = ?, last_name = ?, email = ?, user_uid = ?, role_id = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    const [result] = await db.query(sql, [
      first_name.trim(),
      last_name.trim(),
      cleanEmail,
      cleanUid,
      role_id,
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   ADMIN: HARD DELETE USER (permanent)
============================================================ */
router.delete("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_user_id } = req.body;

    if (Number(id) === Number(admin_user_id))
      return res.status(400).json({
        message: "You cannot delete your own account.",
      });

    const [result] = await db.query(`DELETE FROM users WHERE user_id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User permanently deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
