// backend/src/routes/scheduleRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/* ============================================================
   AUTH MIDDLEWARE — same JWT as /auth/login
============================================================ */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error (schedule):", err);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}


router.get("/", (req, res) => {
  res.json({ message: "scheduleRoutes root is working" });
});

/* ============================================================
   GET /api/schedule/my
   Fetch all APPROVED events the user registered for
============================================================ */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: missing user id." });
    }

    const sql = `
      SELECT 
        e.event_id,
        e.title,
        e.description,
        e.start_datetime,
        e.end_datetime,

        e.location_id,
        cl.location_name,
        cl.building,
        cl.room,

        e.category,
        e.instructor_email,
        e.registration_required,
        e.status
      FROM event_registrations er
      JOIN events e ON er.event_id = e.event_id

      LEFT JOIN campus_locations cl 
        ON cl.location_id = e.location_id

      WHERE er.user_id = ?
        AND e.status = 'approved'
      ORDER BY e.start_datetime;
    `;

    const [rows] = await db.query(sql, [userId]);

    return res.json({ events: rows });
  } catch (err) {
    console.error("GET /api/schedule/my error:", err);
    return res.status(500).json({ message: "Server error fetching schedule." });
  }
});

module.exports = router;
