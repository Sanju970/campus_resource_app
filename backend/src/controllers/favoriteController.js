const pool = require('../config/db');

const addFavorite = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { item_type, item_id } = req.body;
    if (!item_type || !item_id) return res.status(400).json({ message: 'Missing item_type or item_id' });
    await pool.query('INSERT INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)', [user_id, item_type, item_id]);
    res.json({ message: 'Favorited' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const favId = req.params.id;
    await pool.query('DELETE FROM favorites WHERE favorite_id = ? AND user_id = ?', [favId, user_id]);
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listFavorites = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addFavorite, removeFavorite, listFavorites };
