const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all announcements
router.get('/', (req, res) => {
  db.query(
    'SELECT a.announcement_id, a.title, a.content, a.priority, a.created_by, a.created_at FROM announcements a',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Get single announcement by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM announcements WHERE announcement_id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length)
        return res.status(404).json({ message: 'Announcement not found' });
      res.json(results[0]);
    }
  );
});

// Create a new announcement (admin only)
router.post('/', (req, res) => {
  const { title, content, priority, created_by } = req.body;

  if (!title || !content || !priority || !created_by) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.query(
    'INSERT INTO announcements (title, content, priority, created_by) VALUES (?, ?, ?, ?)',
    [title, content, priority, created_by],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(
        'SELECT * FROM announcements WHERE announcement_id = ?',
        [results.insertId],
        (err2, inserted) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json(inserted[0]);
        }
      );
    }
  );
});

// Update announcement
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, priority } = req.body;

  db.query(
    'UPDATE announcements SET title=?, content=?, priority=? WHERE announcement_id=?',
    [title, content, priority, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Announcement updated successfully' });
    }
  );
});

// Delete announcement
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM announcements WHERE announcement_id=?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Announcement deleted successfully' });
    }
  );
});

module.exports = router;
