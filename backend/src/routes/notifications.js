const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all notifications
router.get('/', (req, res) => {
  db.query('SELECT * FROM notifications', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get notifications for a user
router.get('/user/:user_id', (req, res) => {
  db.query('SELECT * FROM notifications WHERE user_id=?', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add notification
router.post('/', (req, res) => {
  const { user_id, message } = req.body;
  db.query(
    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [user_id, message],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Notification sent', notification_id: results.insertId });
    }
  );
});

// Mark as read
router.put('/:id/read', (req, res) => {
  db.query('UPDATE notifications SET is_read=TRUE WHERE notification_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notification marked as read' });
  });
});

module.exports = router;
