// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const crypto = require("crypto");
const sendEmail = require("../config/sendEmail");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const DEFAULT_BIO = "This is my profile bio.";

/* ---------------------------------------------------------
   TEST EMAIL
--------------------------------------------------------- */
router.get("/test-mail", async (req, res) => {
  try {
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: "SMTP Test",
      html: "<h2>SMTP working!</h2>",
    });
    res.send("Email sent successfully.");
  } catch (err) {
    res.status(500).send("Email failed: " + err.message);
  }
});

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
    /[!@#$%^&*(),.?\":{}|<>]/.test(password)
  );
}

/* ---------------------------------------------------------
   REGISTER  (student/faculty)
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
        message:
          "Invalid User ID format. Must start with stu/fac followed by 4–5 digits.",
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
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      cleanFirst,
      cleanLast,
      cleanUid,
      email,
      hashedPassword,
      role_id,
      DEFAULT_BIO,
    ]);

    // 🔥 Send welcome email BEFORE returning response
    try {
      await sendEmail({
        to: email,
        subject: "🎉 Welcome to Campus Portal!",
        html: `
          <h2>Welcome, ${cleanFirst}!</h2>
          <p>Your Campus Portal account has been created successfully.</p>
          <p>You can now log in using:</p>
          <ul>
            <li><strong>User ID:</strong> ${cleanUid}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <p>Regards,<br>Campus Portal Team</p>
        `,
      });
    } catch (err) {
      console.error("Welcome Email Failure:", err);
    }

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        first_name: cleanFirst,
        last_name: cleanLast,
        user_uid: cleanUid,
        email,
        role_id,
        bio: DEFAULT_BIO,
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
    const { identifier, password } = req.body; // FIXED: removed extra )
    
    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/User ID and password are required.",
      });
    }
    if (identifier.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim().toLowerCase())) {
        return res.status(400).json({
          message: "Invalid email format.",
        });
      }
    }
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    
    const [rows] = await db.query(
      "SELECT * FROM users WHERE (email = ? OR user_uid = ?) LIMIT 1",
      [cleanId, cleanId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact administrator.",
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,        // ADDED: useful for authorization
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
          user.role_id === 1 ? "student" :
          user.role_id === 2 ? "faculty" : "admin",
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   CHANGE PASSWORD (LOGGED-IN)
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

    if (!rows.length)
      return res.status(404).json({ message: "User not found." });

    const user = rows[0];

    if (!user.is_active)
      return res.status(403).json({
        message: "Your account is deactivated. Contact administrator.",
      });

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match)
      return res.status(400).json({ message: "Old password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE user_uid=?",
      [hashed, user_uid]
    );

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   FORGOT PASSWORD — SEND TOKEN
--------------------------------------------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier)
      return res.status(400).json({ message: "Please enter email or user ID." });

    const cleanId = identifier.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT * FROM users WHERE user_uid=? OR email=? LIMIT 1",
      [cleanId, cleanId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "No user found." });

    const user = rows[0];

    if (!user.is_active)
      return res.status(403).json({
        message: "Your account is deactivated. Contact administrator.",
      });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 15 * 60 * 1000;

    await db.query(
      "UPDATE users SET reset_token=?, reset_token_expire=? WHERE user_id=?",
      [token, expires, user.user_id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "🔐 Reset Your Campus Portal Password",
        html: `
          <h2>Hello ${user.first_name},</h2>
          <p>Use the link below to reset your password (valid 15 mins):</p>
          <a href="${resetLink}">${resetLink}</a>
        `,
      });
    } catch (err) {
      console.error("Reset Email Error:", err);
    }

    return res.json({
      message: "A password reset link has been sent to your email.",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/* ---------------------------------------------------------
   RESET PASSWORD — USE TOKEN
--------------------------------------------------------- */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ message: "New password is required." });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, uppercase, lowercase, number, special character.",
      });

    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token=? AND reset_token_expire > ?",
      [token, Date.now()]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired link." });

    const user = rows[0];

    const same = await bcrypt.compare(newPassword, user.password_hash);
    if (same)
      return res.status(400).json({
        message: "New password must be different from the previous one.",
      });

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expire=NULL WHERE user_id=?",
      [hashed, user.user_id]
    );

    try {
      await sendEmail({
        to: user.email,
        subject: "✔ Your Password Was Reset",
        html: `<p>Hello ${user.first_name}, your password was successfully updated.</p>`,
      });
    } catch (emailErr) {
      console.error("Reset confirmation email error:", emailErr);
    }

    return res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
