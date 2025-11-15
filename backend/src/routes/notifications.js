const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM notifications');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notifications for a user
router.get('/user/:user_id', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM notifications WHERE user_id=?', [req.params.user_id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add notification
router.post('/', async (req, res) => {
  try {
    const { user_id, message } = req.body;
    const [results] = await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [user_id, message]
    );
    res.json({ message: 'Notification sent', notification_id: results.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE notification_id=?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE notification_id=?', [req.params.id]);
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
