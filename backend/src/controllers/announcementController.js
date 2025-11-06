const pool = require('../config/db');

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const created_by = req.user.user_id;
    await pool.query('INSERT INTO announcements (title, content, priority, created_by) VALUES (?, ?, ?, ?)', [title, content, priority || 'low', created_by]);
    res.json({ message: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 200');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createAnnouncement, listAnnouncements };
