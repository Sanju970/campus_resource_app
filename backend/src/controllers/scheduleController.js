// controllers/scheduleController.js
const db = require('../config/db');

/**
 * GET /api/schedule/my
 * Returns events the logged-in user is registered for
 */
const getMySchedule = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: no user in token' });
    }

    const sql = `
      SELECT 
        e.event_id,
        e.title,
        e.description,
        e.start_datetime,
        e.end_datetime,
        e.location,
        e.category,
        e.instructor_email,
        e.registration_required,
        e.status
      FROM event_registrations er
      JOIN events e ON er.event_id = e.event_id
      WHERE er.user_id = ?
        AND e.status = 'approved'
      ORDER BY e.start_datetime;
    `;

    const [rows] = await db.query(sql, [userId]);

    return res.json({ events: rows });
  } catch (err) {
    console.error('getMySchedule error:', err);
    return res.status(500).json({ message: 'Server error fetching schedule.' });
  }
};

module.exports = {
  getMySchedule,
};
