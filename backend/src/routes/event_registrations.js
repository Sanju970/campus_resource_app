const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all registrations
router.get('/', (req, res) => {
  db.query('SELECT * FROM event_registrations', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get registrations for a specific event
router.get('/event/:event_id', (req, res) => {
  db.query('SELECT * FROM event_registrations WHERE event_id=?', [req.params.event_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get registrations for a user
router.get('/user/:user_id', (req, res) => {
  db.query('SELECT * FROM event_registrations WHERE user_id=?', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Register a user for an event
router.post('/', (req, res) => {
  const { event_id, user_id } = req.body;
  db.query(
    'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
    [event_id, user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User registered for event', registration_id: results.insertId });
    }
  );
});

// Cancel registration
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM event_registrations WHERE registration_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Registration cancelled' });
  });
});

module.exports = router;
