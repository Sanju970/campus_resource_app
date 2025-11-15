const express = require('express');
const router = express.Router();
const db = require('../config/db'); // This must be a promise pool!

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT a.announcement_id, a.title, a.content, a.priority, a.created_by, a.created_at 
      FROM announcements a
      WHERE a.created_at > (NOW() - INTERVAL 24 HOUR)`
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single announcement by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query(
      'SELECT * FROM announcements WHERE announcement_id = ?',
      [id]
    );
    if (!results.length) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new announcement (admin only)
router.post('/', async (req, res) => {
  const { title, content, priority, created_by } = req.body;
  if (!title || !content || !priority || !created_by) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await db.query(
      'INSERT INTO announcements (title, content, priority, created_by) VALUES (?, ?, ?, ?)',
      [title, content, priority, created_by]
    );
    const [inserted] = await db.query(
      'SELECT * FROM announcements WHERE title = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [title, created_by]
    );
    res.json(inserted[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ message: 'You have already created an announcement with this title.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, priority } = req.body;
  try {
    await db.query(
      'UPDATE announcements SET title=?, content=?, priority=? WHERE announcement_id=?',
      [title, content, priority, id]
    );
    res.json({ message: 'Announcement updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'DELETE FROM announcements WHERE announcement_id=?',
      [id]
    );
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
