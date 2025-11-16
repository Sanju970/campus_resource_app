const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // this should be a mysql2/promise pool

// ---------------- CATEGORY / FACULTY MAPPING ----------------

// category_id -> display name
const CATEGORY_NAME_BY_ID = {
  1: 'Library & Study Spaces',
  2: 'Academic Support',
  3: 'Career Services',
  4: 'Health & Wellness',
  5: 'IT Services',
  6: 'Activities',
};

// category_id -> faculty user_uid
const CATEGORY_FACULTY_UID = {
  1: 'fac0001',
  2: 'fac0002',
  3: 'fac0003',
  4: 'fac0004',
  5: 'fac0005',
  6: 'fac0006',
};

// ---------------- GET events (student view: approved + own events) ----------------
router.get('/', async (req, res) => {
  const { user_id } = req.query; // optional

  let query;
  let params = [];

  if (user_id) {
    // Approved events + events created by this user
    query = `
      SELECT e.*,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.event_id) AS registered_count
      FROM events e
      WHERE e.status = 'approved'
         OR e.created_by = ?
      ORDER BY e.start_datetime DESC
    `;
    params = [user_id];
  } else {
    // Only approved events
    query = `
      SELECT e.*,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.event_id) AS registered_count
      FROM events e
      WHERE e.status = 'approved'
      ORDER BY e.start_datetime DESC
    `;
  }

  try {
    const [results] = await pool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Events fetch error:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch events', error: err.message });
  }
});

// ---------------- GET user registrations ----------------
router.get('/registrations/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT event_id FROM event_registrations WHERE user_id = ?';

  try {
    const [results] = await pool.query(query, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Registration fetch error:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch registrations', error: err.message });
  }
});

// ---------------- CREATE event ----------------
router.post('/', async (req, res) => {
  const {
    title,
    description,
    date_time,        // from frontend (optional)
    end_time,         // from frontend (optional)
    start_datetime,   // preferred if frontend sends this
    end_datetime,     // preferred if frontend sends this
    location,
    capacity,
    category_id,      // 1–6
    registration_required,
    instructor_email,
    created_by,       // student/faculty/admin user_id from auth
    status,           // usually undefined from frontend
  } = req.body;

  const startTime = start_datetime || date_time;
  const endTime = end_datetime || end_time;
  const catId = category_id ? Number(category_id) : null;

  if (!title || !description || !startTime || !endTime || !location || !capacity || !catId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const categoryName = CATEGORY_NAME_BY_ID[catId] || null;
  const approverUid = CATEGORY_FACULTY_UID[catId] || null;

  try {
    let approvedByUserId = null;
    let approverEmail = null;

    // If we have a mapped faculty UID, look up their user_id
    if (approverUid) {
      const facultyQuery = 'SELECT user_id, email FROM users WHERE user_uid = ? LIMIT 1';
      const [facRows] = await pool.query(facultyQuery, [approverUid]);

      const approver = facRows[0] || null;
      if (approver) {
        approvedByUserId = approver.user_id;
        approverEmail = approver.email;
      }
    }

    const finalInstructorEmail = instructor_email || approverEmail || null;
    const finalStatus = status || 'pending';

    const insertQuery = `
      INSERT INTO events
        (title, description, start_datetime, end_datetime, location,
         capacity, category_id, category, registration_required, instructor_email,
         created_by, approved_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [results] = await pool.query(insertQuery, [
      title,
      description,
      startTime,
      endTime,
      location,
      parseInt(capacity, 10),
      catId,
      categoryName,
      registration_required ? 1 : 0,
      finalInstructorEmail,
      created_by,
      approvedByUserId,
      finalStatus,
    ]);

    res.status(201).json({
      event_id: results.insertId,
      title,
      description,
      start_datetime: startTime,
      end_datetime: endTime,
      location,
      capacity: parseInt(capacity, 10),
      category_id: catId,
      category: categoryName,
      registration_required,
      instructor_email: finalInstructorEmail,
      created_by,
      approved_by: approvedByUserId,
      status: finalStatus,
      registered_count: 0,
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res
      .status(500)
      .json({ message: 'Failed to create event', error: err.message });
  }
});

// ---------------- GET pending events for a specific faculty ----------------
router.get('/faculty/:faculty_id/pending', async (req, res) => {
  const facultyId = req.params.faculty_id;

  if (!facultyId) {
    return res
      .status(400)
      .json({ message: 'Invalid faculty id for pending events' });
  }

  const query = `
    SELECT e.*,
      (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.event_id) AS registered_count
    FROM events e
    WHERE e.approved_by = ?
      AND e.status = 'pending'
    ORDER BY e.start_datetime ASC
  `;

  try {
    const [rows] = await pool.query(query, [facultyId]);
    res.json(rows);
  } catch (err) {
    console.error('Faculty pending events fetch error:', err);
    res
      .status(500)
      .json({
        message: 'Failed to fetch faculty pending events',
        error: err.message,
      });
  }
});

// ---------------- RSVP endpoints ----------------
router.post('/:event_id/rsvp', async (req, res) => {
  const eventId = req.params.event_id;
  const { user_id } = req.body;
  const query =
    'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)';

  try {
    await pool.query(query, [eventId, user_id]);
    res.json({ message: 'RSVP successful' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(400)
        .json({ message: 'Already registered for this event' });
    }
    console.error('RSVP error:', err);
    res
      .status(500)
      .json({ message: 'Failed to register', error: err.message });
  }
});

router.delete('/:event_id/rsvp', async (req, res) => {
  const eventId = req.params.event_id;
  const { user_id } = req.body;
  const query =
    'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?';

  try {
    await pool.query(query, [eventId, user_id]);
    res.json({ message: 'RSVP cancelled successfully' });
  } catch (err) {
    console.error('Cancel RSVP error:', err);
    res
      .status(500)
      .json({ message: 'Failed to cancel RSVP', error: err.message });
  }
});

// ---------------- APPROVE / REJECT actions ----------------
router.patch('/:event_id/approve', async (req, res) => {
  const eventId = req.params.event_id;
  const query = 'UPDATE events SET status = "approved" WHERE event_id = ?';

  try {
    await pool.query(query, [eventId]);
    res.json({ message: 'Event approved successfully' });
  } catch (err) {
    console.error('Approve event error:', err);
    res
      .status(500)
      .json({ message: 'Failed to approve event', error: err.message });
  }
});

router.patch('/:event_id/reject', async (req, res) => {
  const eventId = req.params.event_id;
  const query = 'UPDATE events SET status = "rejected" WHERE event_id = ?';

  try {
    await pool.query(query, [eventId]);
    res.json({ message: 'Event rejected successfully' });
  } catch (err) {
    console.error('Reject event error:', err);
    res
      .status(500)
      .json({ message: 'Failed to reject event', error: err.message });
  }
});

// ---------------- CANCEL action (creator: faculty/admin) ----------------
// ---------------- DELETE / CANCEL EVENT (hard delete) ----------------
router.delete('/:event_id', async (req, res) => {
  const eventId = req.params.event_id;

  try {
    // First delete registrations for this event (to avoid FK issues)
    await pool.query(
      'DELETE FROM event_registrations WHERE event_id = ?',
      [eventId]
    );

    // Then delete the event itself
    await pool.query('DELETE FROM events WHERE event_id = ?', [eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({
      message: 'Failed to delete event',
      error: err.message,
    });
  }
});

module.exports = router;
