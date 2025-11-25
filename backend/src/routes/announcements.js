const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Promise pool
const sendEmail = require('../config/sendEmail');

// Helper to get all user emails
async function getAllUserEmails() {
  const [users] = await db.query('SELECT email FROM users WHERE email IS NOT NULL');
  return users.map(u => u.email).filter(Boolean);
}

// Get all announcements (last 24 hours)
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT a.announcement_id, a.title, a.content, a.priority, a.created_by, a.created_at, a.org_id
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

// Create a new announcement (admin/org roles only)
router.post('/', async (req, res) => {
  const { title, content, priority, created_by, org_id } = req.body;

  // Min length validation
  if (!title || title.length < 3) {
    return res
      .status(400)
      .json({ message: 'Title is required and must be at least 3 characters long.' });
  }
  if (!content || content.length < 10) {
    return res
      .status(400)
      .json({ message: 'Content/description is required and must be at least 10 characters long.' });
  }

  // Required fields validation
  if (!priority || !created_by || !org_id) {
    return res
      .status(400)
      .json({ message: 'Missing required fields (priority, created_by, org_id)' });
  }

  try {
    // Insert the announcement including org_id
    await db.query(
      'INSERT INTO announcements (title, content, priority, created_by, org_id) VALUES (?, ?, ?, ?, ?)',
      [title, content, priority, created_by, org_id]
    );
    // Fetch the inserted announcement for response
    const [inserted] = await db.query(
      'SELECT * FROM announcements WHERE title = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [title, created_by]
    );

    // Fetch all users for notifications and emails
    const [users] = await db.query('SELECT user_id, email FROM users WHERE email IS NOT NULL');
    const message = `New announcement posted: ${title}`;

    // Insert notifications for all users asynchronously
    const notificationPromises = users.map(user =>
      db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user.user_id, message])
    );
    await Promise.all(notificationPromises);

    // Send email notifications to all users
    const emailRecipients = users.map(u => u.email).filter(Boolean);
    if (emailRecipients.length) {
      const subject = `New Announcement: ${title}`;
      const html = `
        <p>A new announcement has been posted:</p>
        <p><strong>${title}</strong></p>
        <p>${content}</p>
      `;
      try {
        await sendEmail({ to: emailRecipients.join(','), subject, html });
      } catch (err) {
        console.error('Error sending announcement creation emails:', err);
      }
    }

    // Respond with the newly created announcement
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

// Update announcement completely
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, priority, org_id } = req.body;
  if (!title || !content || !priority || !org_id) {
    return res.status(400).json({ message: 'Missing required fields (title, content, priority, org_id)' });
  }
  try {
    await db.query(
      'UPDATE announcements SET title=?, content=?, priority=?, org_id=? WHERE announcement_id=?',
      [title, content, priority, org_id, id]
    );
    res.json({ message: 'Announcement updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Partial update announcement (PATCH)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, priority, org_id } = req.body;
  if (!title || !content || !priority || !org_id) {
    return res.status(400).json({ message: 'Missing required fields (title, content, priority, org_id)' });
  }
  try {
    await db.query(
      'UPDATE announcements SET title=?, content=?, priority=?, org_id=? WHERE announcement_id=?',
      [title, content, priority, org_id, id]
    );
    res.json({ message: 'Announcement updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete announcement and send emails
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get announcement details for email content
    const [rows] = await db.query('SELECT title, content FROM announcements WHERE announcement_id=?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    const announcement = rows[0];

    // Fetch all users with emails
    const [users] = await db.query('SELECT user_id, email FROM users WHERE email IS NOT NULL');
    const message = `Announcement cancelled: ${announcement.title}`;

    // Send email notifications about deletion
    const emailRecipients = users.map(u => u.email).filter(Boolean);
    if (emailRecipients.length) {
      const subject = `Announcement Cancelled: ${announcement.title}`;
      const html = `
        <p>The following announcement has been cancelled:</p>
        <p><strong>${announcement.title}</strong></p>
        <p>${announcement.content}</p>
      `;
      try {
        await sendEmail({ to: emailRecipients.join(','), subject, html });
      } catch (err) {
        console.error('Error sending announcement deletion emails:', err);
      }
    }

    // Insert notifications for all users asynchronously
    const notificationPromises = users.map(user =>
      db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user.user_id, message])
    );
    await Promise.all(notificationPromises);

    // Delete the announcement
    await db.query('DELETE FROM announcements WHERE announcement_id=?', [id]);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
