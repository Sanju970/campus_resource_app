// routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const sendEmail = require('../config/sendEmail');

const router = express.Router();

const DEFAULT_BIO = "This is my profile bio.";

/* 
   ADMIN: FETCH USERS
 */
router.get("/admin/users", async (req, res) => {
  try {
    const includeAll = req.query.all === "true";

    const sql = includeAll
      ? `SELECT user_id, first_name, last_name, user_uid, email, bio, role_id, is_active FROM users`
      : `SELECT user_id, first_name, last_name, user_uid, email, bio, role_id, is_active 
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

/* 
   ADMIN: CREATE USER
 */
router.post("/admin/create", async (req, res) => {
  try {
    const { first_name, last_name, user_uid, password, role_id } = req.body;

    if (!first_name || !last_name || !user_uid)
      return res.status(400).json({ message: "Missing required fields" });

    const cleanUid = user_uid.trim().toLowerCase();
    const uidPattern = /^(stu|fac|adm)\d{4,5}$/;

    if (!uidPattern.test(cleanUid))
      return res.status(400).json({
        message: "Invalid User ID. Must be stu/fac/adm + 4-5 digits.",
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

    const email = `${cleanUid}@gmail.com`;

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
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id, bio, email_notifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const [result] = await db.query(sql, [
      first_name.trim(),
      last_name.trim(),
      cleanUid,
      email,
      hashed,
      autoRole,
      DEFAULT_BIO,
    ]);

    // ------------- SEND EMAIL BEFORE RETURN ---------------
    try {
      await sendEmail({
        to: email.toLowerCase(),
        subject: "🎉 Your Campus Portal Account is Ready",
        html: `
          <h2>Hello ${first_name},</h2>
          <p>An administrator has created an account for you.</p>
          <p>Your temporary login details:</p>
          <ul>
            <li><strong>User ID:</strong> ${cleanUid}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${plainPassword}</li>
          </ul>
          <p>Please log in and change your password immediately.</p>
          <br>
          <p>Regards,<br>Campus Portal Team</p>
        `
      });
    } catch (err) {
      console.error("Email send failed:", err);
      // do NOT break user creation if email fails
    }

    // ------------- NOW RETURN SUCCESS RESPONSE -------------
    return res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: result.insertId,
        first_name,
        last_name,
        user_uid: cleanUid,
        email,
        role_id: autoRole,
        bio: DEFAULT_BIO,
        dummy_password: plainPassword,
      },
    });

  } catch (err) {
    console.error("Admin create user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* 
   ADMIN: STATS – TOTAL STUDENTS & FACULTY
 */

router.get("/admin/students/count", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role_id = 1"
    );
    return res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Student count error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

router.get("/admin/faculty/count", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role_id = 2"
    );
    return res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Faculty count error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Admin: counts for students and faculty 
router.get("/admin/students/count", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role_id = 1"
    );
    return res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Student count error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

router.get("/admin/faculty/count", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role_id = 2"
    );
    return res.json({ count: rows[0].count });
  } catch (err) {
    console.error("Faculty count error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});


/* 
   ADMIN: DEACTIVATE USER (soft delete)
 */
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

/* 
   ADMIN: REACTIVATE USER
 */
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

/* 
   ADMIN: UPDATE USER
 */
router.patch("/admin/users/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, user_uid, bio } = req.body;

    if (!first_name || !last_name || !user_uid)
      return res.status(400).json({ message: "All fields are required." });

    const cleanUid = user_uid.trim().toLowerCase();
    const uidPattern = /^(stu|fac|adm)\d{4,5}$/;

    if (!uidPattern.test(cleanUid))
      return res.status(400).json({
        message: "Invalid UID format.",
      });

    const cleanEmail = `${cleanUid}@gmail.com`;

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
      SET first_name = ?, last_name = ?, email = ?, user_uid = ?, role_id = ?, bio = ?, updated_at = NOW()
      WHERE user_id = ?
    `;

    const [result] = await db.query(sql, [
      first_name.trim(),
      last_name.trim(),
      cleanEmail,
      cleanUid,
      role_id,
      bio || DEFAULT_BIO,
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

  //  ADMIN: HARD DELETE USER 
router.delete("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Accept admin_user_id from query or body
    const admin_user_id =
      req.body?.admin_user_id || req.query?.admin_user_id;

    if (!admin_user_id)
      return res.status(400).json({ message: "admin_user_id is required" });

    if (Number(id) === Number(admin_user_id))
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });

    // BLOCK if user has announcements within 24 hours
    const [recentAnnouncements] = await db.query(
      `
      SELECT announcement_id 
      FROM announcements 
      WHERE created_by = ?
      AND created_at > (NOW() - INTERVAL 24 HOUR)
      LIMIT 1
    `,
      [id]
    );

    if (recentAnnouncements.length > 0)
      return res.status(400).json({
        message:
          "Cannot delete user: they have announcements created in the last 24 hours.",
      });

    const [activeEvents] = await db.query(
      `
      SELECT event_id
      FROM events
      WHERE created_by = ?
      AND end_datetime >= NOW()   -- future or ongoing events
      LIMIT 1
      `,
      [id]
    );
    if (activeEvents.length > 0)
      return res.status(400).json({
        message:
          "Cannot delete user: they have upcoming or ongoing events.",
      });

    const [orgRoles] = await db.query(
      `
      SELECT org_id 
      FROM organization_members
      WHERE user_id = ?
      AND role IN ('admin_delegate', 'lead_faculty')
      LIMIT 1
      `,
      [id]
    );

    if (orgRoles.length > 0)
      return res.status(400).json({
        message:
          "Cannot delete user: they are an organization admin_delegate or lead_faculty. Transfer roles first.",
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

/* 
   Get user details by user ID (NO CACHE)
*/
router.get(
  "/user/:id",
  (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  },
  async (req, res) => {
    const { id } = req.params;
    try {
      const [results] = await db.query(
        `SELECT 
            user_id, 
            user_uid, 
            first_name, 
            last_name, 
            email, 
            bio, 
            role_id,
            CASE 
              WHEN role_id = 3 THEN 'admin'
              WHEN role_id = 2 THEN 'faculty'
              WHEN role_id = 1 THEN 'student'
              ELSE 'unknown'
            END AS role,
            email_notifications,
            is_active,
            created_at, 
            updated_at 
         FROM users 
         WHERE user_id = ?`,
        [id]
      );

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(results[0]);
    } catch (err) {
      console.error("Get user by id error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);


/* 
   USER: UPDATE BIO (self-service)
 */
router.post("/user/update-bio", async (req, res) => {
  try {
    const { user_id, bio } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const newBio =
      typeof bio === "string" && bio.trim().length > 0
        ? bio.trim()
        : DEFAULT_BIO;

    await db.query(
      "UPDATE users SET bio = ?, updated_at = NOW() WHERE user_id = ?",
      [newBio, user_id]
    );

    return res.json({ message: "Bio updated successfully", bio: newBio });
  } catch (err) {
    console.error("Update bio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* 
   USER: UPDATE PROFILE (first_name, last_name, bio)
 */
router.post("/user/update-profile", async (req, res) => {
  try {
    const { user_id, first_name, last_name, bio } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First and last name required." });
    }

    const cleanFirst = first_name.trim();
    const cleanLast = last_name.trim();
    const cleanBio =
      typeof bio === "string" && bio.trim().length > 0
        ? bio.trim()
        : DEFAULT_BIO;

    // Update user
    await db.query(
      `
      UPDATE users 
      SET first_name = ?, last_name = ?, bio = ?, updated_at = NOW()
      WHERE user_id = ?
      `,
      [cleanFirst, cleanLast, cleanBio, user_id]
    );

    // Fetch FULL updated user object
    const [rows] = await db.query(
      `
      SELECT 
        user_id,
        user_uid,
        first_name,
        last_name,
        email,
        bio,
        role_id,
        email_notifications,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE user_id = ?
      `,
      [user_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile updated successfully",
      user: rows[0],
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


/* 
   UPDATE EMAIL NOTIFICATION PREFERENCE
*/
router.post("/user/update-notifications", async (req, res) => {
  try {
    const { user_id, enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Invalid value" });
    }

    const value = enabled ? 1 : 0;

    await db.query(
      "UPDATE users SET email_notifications = ? WHERE user_id = ?",
      [value, user_id]
    );

    return res.json({
      message: enabled
        ? "Email notifications enabled"
        : "Email notifications disabled",
      email_notifications: value
    });
  } catch (err) {
    console.error("Notification update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 
   GET ALL ACTIVE USERS (for dropdown)
 */
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        user_id,
        first_name,
        last_name,
        email,
        role_id,
        CASE 
          WHEN role_id = 3 THEN 'admin'
          WHEN role_id = 2 THEN 'faculty'
          WHEN role_id = 1 THEN 'student'
          ELSE 'unknown'
        END AS role
      FROM users
      ORDER BY 
        CASE 
          WHEN role_id = 3 THEN 1  -- admin first
          WHEN role_id = 2 THEN 2  -- faculty second
          WHEN role_id = 1 THEN 3  -- student third
          ELSE 4
        END,
        first_name ASC,
        last_name ASC;

    `);
    return res.json(rows);
  } catch (err) {
    console.error("Fetch all users error:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
});

module.exports = router;
