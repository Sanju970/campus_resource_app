// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/* ---------------------------------------------------------
   PASSWORD STRENGTH VALIDATION
--------------------------------------------------------- */
function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

/* ---------------------------------------------------------
   REGISTER  (student/faculty only)
--------------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, user_uid, password } = req.body;

    const cleanFirst = (first_name || "").trim();
    const cleanLast = (last_name || "").trim();
    const cleanUid = (user_uid || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanFirst || !cleanLast || !cleanUid || !cleanPass) {
      return res.status(400).json({
        message: "First name, last name, User ID, and password are required.",
      });
    }

    const uidPattern = /^(stu|fac)\d{4,5}$/;
    if (!uidPattern.test(cleanUid)) {
      return res.status(400).json({
        message: "Invalid User ID format. Must start with stu/fac followed by 4–5 digits.",
      });
    }

    const role_id = cleanUid.startsWith("stu") ? 1 : 2;

    if (!isStrongPassword(cleanPass)) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, uppercase, lowercase, number, and special character.",
      });
    }

    const email = `${cleanUid}@gmail.com`;
    const hashedPassword = await bcrypt.hash(cleanPass, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      cleanFirst,
      cleanLast,
      cleanUid,
      email,
      hashedPassword,
      role_id,
    ]);

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        first_name: cleanFirst,
        last_name: cleanLast,
        user_uid: cleanUid,
        email,
        role_id,
        created_at: new Date(),
      },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "User ID or email already exists." });
    }
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   LOGIN 
--------------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/User ID and password are required.",
      });
    }

    const cleanId = identifier.trim().toLowerCase();

    const lookupQuery = `
      SELECT * FROM users 
      WHERE (email = ? OR user_uid = ?) 
      LIMIT 1
    `;

    const [rows] = await db.query(lookupQuery, [cleanId, cleanId]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact the administrator.",
      });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Create token
    const token = jwt.sign(
      {
        user_uid: user.user_uid,
        email: user.email,
        role_id: user.role_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        user_id: user.user_id,
        user_uid: user.user_uid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        created_at: user.created_at,
        role:
          user.role_id === 1
            ? "student"
            : user.role_id === 2
            ? "faculty"
            : "admin",
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   CHANGE PASSWORD (logged-in)
--------------------------------------------------------- */
router.post("/change-password", async (req, res) => {
  try {
    const { user_uid, oldPassword, newPassword } = req.body;

    if (!user_uid || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, uppercase, lowercase, number, and special character.",
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE user_uid = ? LIMIT 1",
      [user_uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = rows[0];

    // Block password change if deactivated
    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact the administrator.",
      });
    }

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_uid = ?",
      [hashed, user_uid]
    );

    return res.json({
      message: "Password updated successfully.",
      updated_at: new Date(),
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   FORGOT PASSWORD
--------------------------------------------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, uppercase, lowercase, number, and special character.",
      });
    }

    const cleanId = identifier.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT * FROM users WHERE user_uid = ? OR email = ? LIMIT 1",
      [cleanId, cleanId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = rows[0];

    // NEW RULE: Block if deactivated
    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact the administrator.",
      });
    }

    // Prevent reusing same password
    const same = await bcrypt.compare(newPassword, user.password_hash);
    if (same) {
      return res.status(400).json({
        message: "New password must be different from the old password.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_uid = ?",
      [hashed, user.user_uid]
    );

    return res.json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
});

module.exports = router;
