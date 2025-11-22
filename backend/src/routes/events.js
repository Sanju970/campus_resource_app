const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // mysql2/promise pool
const sendEmail = require('../config/sendEmail');

/* ================================
   NOTIFICATIONS HELPER
================================== */
async function createNotification(userId, message) {
  if (!userId || !message) return;

  try {
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)',
      [userId, message]
    );
  } catch (err) {
    console.error('Notification insert error:', err);
  }
}

/* ================================
   CATEGORY / FACULTY MAPPING
================================== */

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

/* ================================
   GET /api/events
   Return ALL events + registered_count
================================== */
router.get('/', async (req, res) => {
  // currently we ignore user_id here and let frontend filter
  let query = `
    SELECT e.*,
           (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.event_id)
             AS registered_count
    FROM events e
    ORDER BY e.start_datetime DESC
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    console.error('Events fetch error:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch events', error: err.message });
  }
});

/* ================================
   GET user registrations
   GET /api/events/registrations/:user_id
================================== */
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

/* ================================
   RSVP: Register for an event
   POST /api/events/:event_id/rsvp
================================== */
router.post('/:event_id/rsvp', async (req, res) => {
  try {
    const eventId = req.params.event_id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    // prevent duplicate registrations
    await pool.query(
      `
        INSERT IGNORE INTO event_registrations (event_id, user_id, registered_at)
        VALUES (?, ?, NOW())
      `,
      [eventId, user_id]
    );

    // Return updated registered_count
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS registered_count FROM event_registrations WHERE event_id = ?',
      [eventId]
    );

    const registered_count = rows[0]?.registered_count || 0;

    res.json({ registered_count });
  } catch (err) {
    console.error('RSVP register error:', err);
    res
      .status(500)
      .json({ message: 'Failed to register for event', error: err.message });
  }
});

/* ================================
   RSVP: Cancel registration
   DELETE /api/events/:event_id/rsvp
================================== */
router.delete('/:event_id/rsvp', async (req, res) => {
  try {
    const eventId = req.params.event_id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    await pool.query(
      'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, user_id]
    );

    const [rows] = await pool.query(
      'SELECT COUNT(*) AS registered_count FROM event_registrations WHERE event_id = ?',
      [eventId]
    );

    const registered_count = rows[0]?.registered_count || 0;

    res.json({ registered_count });
  } catch (err) {
    console.error('RSVP cancel error:', err);
    res
      .status(500)
      .json({ message: 'Failed to cancel RSVP', error: err.message });
  }
});

/* ================================
   CREATE event
   POST /api/events
   - auto-approved
   - supports org_id + members_only
================================== */
router.post('/', async (req, res) => {
  const {
    title,
    description,
    date_time,       // optional
    end_time,        // optional
    start_datetime,  // preferred if provided from frontend
    end_datetime,    // preferred if provided from frontend
    location,
    capacity,
    category_id,     // 1–6
    registration_required,
    instructor_email,
    created_by,      // user_id
    organization_id, // org_id for this event
    members_only,    // boolean from frontend
  } = req.body;

  const startTime = start_datetime || date_time;
  const endTime = end_datetime || end_time;
  const catId = category_id ? Number(category_id) : null;
  const orgId = organization_id ? Number(organization_id) : null;

  if (
    !title ||
    !description ||
    !startTime ||
    !endTime ||
    !location ||
    !capacity ||
    !catId ||
    !orgId
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const categoryName = CATEGORY_NAME_BY_ID[catId] || null;
  const approverUid = CATEGORY_FACULTY_UID[catId] || null;

  try {
    let approvedByUserId = null;
    let approverEmail = null;

    // Lookup approver user_id and email if approver UID exists
    if (approverUid) {
      const facultyQuery =
        'SELECT user_id, email FROM users WHERE user_uid = ? LIMIT 1';
      const [facRows] = await pool.query(facultyQuery, [approverUid]);
      const approver = facRows[0] || null;
      if (approver) {
        approvedByUserId = approver.user_id;
        approverEmail = approver.email;
      }
    }

    const finalInstructorEmail = instructor_email || approverEmail || null;
    const finalStatus = 'approved'; // no pending flow
    const membersOnlyValue =
      members_only === true ||
      members_only === 1 ||
      members_only === '1'
        ? 1
        : 0;

    // Insert event (now includes members_only + org_id)
    const insertQuery = `
      INSERT INTO events
        (title, description, start_datetime, end_datetime, location,
         capacity, category_id, category, registration_required, instructor_email,
         created_by, approved_by, status, org_id, members_only)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      orgId,
      membersOnlyValue,
    ]);

    const newEventId = results.insertId;

    // 🔔 1) Notify creator
    await createNotification(
      created_by,
      `Your event "${title}" has been created.`
    );

    // 🔔 2) Notify all other users
    const [users] = await pool.query('SELECT user_id, email FROM users');
    const notifiedUsers = users.filter(
      (user) => user.user_id !== created_by
    );

    const notifyMessage = `A new event "${title}" has been created.`;
    const notificationPromises = notifiedUsers.map((user) =>
      createNotification(user.user_id, notifyMessage)
    );
    await Promise.all(notificationPromises);

    // Email notifications (best-effort; failures shouldn't break event creation)
    try {
      const emailRecipients = notifiedUsers
        .map((user) => user.email)
        .filter((email) => !!email);

      if (emailRecipients.length > 0) {
        const subject = `New Event: ${title}`;
        const html = `
          <p>A new event has been created:</p>
          <p><strong>${title}</strong></p>
          <p>${description}</p>
          <p><strong>When:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Where:</strong> ${location}</p>
        `;

        await sendEmail(emailRecipients.join(','), subject, html);
      }
    } catch (emailErr) {
      console.error('Error sending event notification emails:', emailErr);
    }

    // Respond with created event
    res.status(201).json({
      event_id: newEventId,
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
      org_id: orgId,
      members_only: membersOnlyValue,
    });
  } catch (err) {
    console.error('Error creating event:', err);

    // handle unique constraint (title + time + location)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'An event with the same title, start time, and location already exists.',
      });
    }

    res
      .status(500)
      .json({ message: 'Failed to create event', error: err.message });
  }
});

/* ================================
   (Optional legacy) GET pending events for a specific faculty
   /api/events/faculty/:faculty_id/pending
   This will usually return 0 now since we auto-approve,
   but keeping it in case you reuse later.
================================== */
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
    res.status(500).json({
      message: 'Failed to fetch faculty pending events',
      error: err.message,
    });
  }
});

/* ================================
   UPDATE event (admin/creator)
   PUT /api/events/:event_id
================================== */
router.put('/:event_id', async (req, res) => {
  const eventId = req.params.event_id;

  const {
    title,
    description,
    start_datetime,
    end_datetime,
    location,
    capacity,
    category_id,
    registration_required,
    instructor_email,
  } = req.body;

  try {
    await pool.query(
      `
        UPDATE events
        SET
          title = ?,
          description = ?,
          start_datetime = ?,
          end_datetime = ?,
          location = ?,
          capacity = ?,
          category_id = ?,
          registration_required = ?,
          instructor_email = ?
        WHERE event_id = ?
      `,
      [
        title,
        description,
        start_datetime,
        end_datetime,
        location,
        capacity,
        category_id,
        registration_required ? 1 : 0,
        instructor_email,
        eventId,
      ]
    );

    const [rows] = await pool.query(
      `
        SELECT
          e.*,
          (
            SELECT COUNT(*)
            FROM event_registrations er
            WHERE er.event_id = e.event_id
          ) AS registered_count
        FROM events e
        WHERE e.event_id = ?
      `,
      [eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Event not found after update' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({
      message: 'Failed to update event',
      error: err.message,
    });
  }
});

/* ================================
   DELETE / CANCEL event (hard delete)
   DELETE /api/events/:event_id
================================== */
router.delete('/:event_id', async (req, res) => {
  const eventId = req.params.event_id;

  try {
    // First delete registrations for this event
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
