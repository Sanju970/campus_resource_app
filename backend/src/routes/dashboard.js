// backend/src/routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // <-- correct import

// GET /api/dashboard/stats/:userId
router.get("/stats/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Count organizations the user is a member of
    const [orgRows] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM organization_members
      WHERE user_id = ?
        AND status = 'approved'
      `,
      [userId]
    );

    // Count RSVP'ed events (registered events endpoint logic)
    const [eventRows] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM event_registrations er
      JOIN events e ON er.event_id = e.event_id
      WHERE er.user_id = ?
        AND e.start_datetime >= NOW()
      `,
      [userId]
    );

    res.json({
      currentOrganizations: orgRows[0]?.count || 0,
      upcomingRsvpedEvents: eventRows[0]?.count || 0,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

module.exports = router;
