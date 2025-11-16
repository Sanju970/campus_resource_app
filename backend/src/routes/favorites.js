const express = require('express');
const router = express.Router();
const db = require('../config/db'); // should export mysql2/promise pool


// Get all favorites
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM favorites');
    res.json(results);
  } catch (err) {
    console.error('Failed to get favorites:', err);
    res.status(500).json({ error: 'Could not retrieve favorites.' });
  }
});

// Get favorites for a user
router.get('/user/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  console.log('Received request for user:', userId);
  if (!userId || isNaN(userId)) {
    console.log('Invalid userId:', userId);
    return res.status(400).json({ error: 'Invalid or missing user_id.' });
  }
  try {
    const [results] = await db.query('SELECT * FROM favorites WHERE user_id=?', [userId]);
    console.log('Query results:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Favorites fetch error:', err);
    res.status(500).json({ error: 'Could not retrieve favorites for user.' });
  }
});

// Add favorite
router.post('/', async (req, res) => {
  const { user_id, item_type, item_id } = req.body;
  if (!user_id || !item_type || !item_id) {
    return res.status(400).json({ error: 'Missing required fields: user_id, item_type, item_id.' });
  }
  try {
    const [results] = await db.query(
      'INSERT INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)',
      [user_id, item_type, item_id]
    );
    res.json({ message: 'Favorite added', favorite_id: results.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Favorite already exists for this item and user.' });
    }
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Could not add favorite.' });
  }
});

// Delete favorite
router.delete('/:id', async (req, res) => {
  const favoriteId = req.params.id;
  if (!favoriteId || isNaN(favoriteId)) {
    return res.status(400).json({ error: 'Invalid favorite ID.' });
  }
  try {
    const [results] = await db.query('DELETE FROM favorites WHERE favorite_id=?', [favoriteId]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found or already deleted.' });
    }
    res.json({ message: 'Favorite removed' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Could not remove favorite.' });
  }
});

module.exports = router
