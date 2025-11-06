const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all favorites
router.get('/', (req, res) => {
  db.query('SELECT * FROM favorites', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get favorites for a user
router.get('/user/:user_id', (req, res) => {
  db.query('SELECT * FROM favorites WHERE user_id=?', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add favorite
router.post('/', (req, res) => {
  const { user_id, item_type, item_id } = req.body;
  db.query(
    'INSERT INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)',
    [user_id, item_type, item_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Favorite added', favorite_id: results.insertId });
    }
  );
});

// Delete favorite
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM favorites WHERE favorite_id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Favorite removed' });
  });
});

module.exports = router;
