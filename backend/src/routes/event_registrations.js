const express = require('express');
const router = express.Router();
const db = require('../config/db');
const sendEmail = require('../config/sendEmail');

// Helper to create a notification in DB
async function createNotification(userId, message) {
  if (!userId || !message) return;
  try {
    await db.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)',
      [userId, message]
    );
  } catch (err) {
    console.error('Notification insert error:', err);
  }
}

// Helper to get email address of a user
async function getUserEmail(userId) {
  const [rows] = await db.query('SELECT email FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) return null;
  return rows[0].email || null;
}

// Register a user for an event with notifications and email
router.post('/', async (req, res) => {
  const { event_id, user_id } = req.body;
  if (!event_id || !user_id) {
    return res.status(400).json({ message: 'event_id and user_id are required' });
  }

  try {
    // Insert registration
    const [results] = await db.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)',
      [event_id, user_id]
    );

    // Send notification to user
    const notifMsg = `You have successfully registered for event #${event_id}.`;
    await createNotification(user_id, notifMsg);

    // Send email to user
    const email = await getUserEmail(user_id);
    if (email) {
      const subject = 'Event Registration Confirmed';
      const html = `<p>You have been registered for Event ID: <strong>${event_id}</strong>.</p>`;
      try {
        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error('Error sending registration email:', err);
      }
    }

    res.json({ message: 'User registered for event', registration_id: results.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel registration with notifications and emails
router.delete('/:id', async (req, res) => {
  const registrationId = req.params.id;

  try {
    // Get registration info for notification and email
    const [rows] = await db.query('SELECT event_id, user_id FROM event_registrations WHERE registration_id = ?', [registrationId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    const registration = rows[0];

    // Delete registration
    await db.query('DELETE FROM event_registrations WHERE registration_id = ?', [registrationId]);

    // Send notification to user
    const notifMsg = `Your registration for event #${registration.event_id} has been cancelled.`;
    await createNotification(registration.user_id, notifMsg);

    // Send email to user
    const email = await getUserEmail(registration.user_id);
    if (email) {
      const subject = 'Event Registration Cancelled';
      const html = `<p>Your registration for Event ID: <strong>${registration.event_id}</strong> has been cancelled.</p>`;
      try {
        await sendEmail({ to: email, subject, html });
      } catch (err) {
        console.error('Error sending cancellation email:', err);
      }
    }

    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

module.exports = router;
