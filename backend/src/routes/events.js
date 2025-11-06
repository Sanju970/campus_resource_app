const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ---------------- GET all events ----------------
router.get('/', (req, res) => {
  console.log('🔥 GET /api/events called');
  const query = `
    SELECT e.*, 
           (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.event_id) AS registered_count
    FROM events e
    ORDER BY e.start_datetime DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Failed to fetch events', error: err.message });
    }
    console.log(`Events fetched: ${results.length}`);
    res.json(results);
  });
});

// ---------------- GET user registrations ----------------
router.get('/registrations/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT event_id FROM event_registrations WHERE user_id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Registration fetch error:', err);
      return res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
    }
    res.json(results);
  });
});

// ---------------- CREATE event ----------------
router.post('/', (req, res) => {
  const {
    title,
    description,
    date_time,        // from frontend
    end_time,         // from frontend
    start_datetime,
    end_datetime,
    location,
    capacity,
    category_id,
    registration_required,
    instructor_email,
    created_by,
    approved_by,
    status,
    created_by_name,
  } = req.body;

  const startTime = start_datetime || date_time;
  const endTime = end_datetime || end_time;
  const category = category_id || null;

  if (!title || !description || !startTime || !endTime || !location) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO events
    (title, description, start_datetime, end_datetime, location, capacity, category,
     registration_required, instructor_email, created_by, approved_by, status, created_by_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      title,
      description,
      startTime,
      endTime,
      location,
      capacity,
      category,
      registration_required,
      instructor_email,
      created_by,
      approved_by || null,
      status || 'pending',
      created_by_name || '',
    ],
    (err, results) => {
      if (err) {
        console.error('Error creating event:', err);
        return res.status(500).json({ message: 'Failed to create event', error: err.message });
      }

      res.json({
        event_id: results.insertId,
        title,
        description,
        start_datetime: startTime,
        end_datetime: endTime,
        location,
        capacity,
        category,
        registration_required,
        instructor_email,
        created_by,
        approved_by,
        status,
        created_by_name,
        registered_count: 0,
      });
    }
  );
});

// ---------------- RSVP endpoints ----------------
router.post('/:event_id/rsvp', (req, res) => {
  const eventId = req.params.event_id;
  const { user_id } = req.body;
  const query = 'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)';

  db.query(query, [eventId, user_id], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Already registered for this event' });
      }
      console.error('RSVP error:', err);
      return res.status(500).json({ message: 'Failed to register', error: err.message });
    }
    res.json({ message: 'RSVP successful' });
  });
});

router.delete('/:event_id/rsvp', (req, res) => {
  const eventId = req.params.event_id;
  const { user_id } = req.body;
  const query = 'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?';

  db.query(query, [eventId, user_id], (err) => {
    if (err) {
      console.error('Cancel RSVP error:', err);
      return res.status(500).json({ message: 'Failed to cancel RSVP', error: err.message });
    }
    res.json({ message: 'RSVP cancelled successfully' });
  });
});

// ---------------- ADMIN actions ----------------
router.patch('/:event_id/approve', (req, res) => {
  const eventId = req.params.event_id;
  const query = 'UPDATE events SET status = "active" WHERE event_id = ?';
  db.query(query, [eventId], (err) => {
    if (err)
      return res.status(500).json({ message: 'Failed to approve event', error: err.message });
    res.json({ message: 'Event approved successfully' });
  });
});

router.delete('/:event_id', (req, res) => {
  const eventId = req.params.event_id;
  const query = 'DELETE FROM events WHERE event_id = ?';
  db.query(query, [eventId], (err) => {
    if (err)
      return res.status(500).json({ message: 'Failed to delete event', error: err.message });
    res.json({ message: 'Event deleted successfully' });
  });
});

module.exports = router;
