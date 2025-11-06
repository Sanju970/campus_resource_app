const pool = require('../config/db');

const listNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markRead = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const notifId = req.params.id;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?', [notifId, user_id]);
    res.json({ message: 'Marked read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listNotifications, markRead };
