const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // mysql2/promise pool
const sendEmail = require('../config/sendEmail');



// Helper to extract emails from users array
function getEmailRecipients(users) {
  return users.map(user => user.email).filter(email => !!email);
}

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

// Helper to get email address of a user
async function getUserEmail(userId) {
  const [rows] = await pool.query('SELECT email FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) return null;
  return rows[0].email || null;
}
/* ================================
   CATEGORY / FACULTY MAPPING
================================== */

const CATEGORY_NAME_BY_ID = {
  1: 'Library & Study Spaces',
  2: 'Academic Support',
  3: 'Career Services',
  4: 'Health & Wellness',
  5: 'IT Services',
  6: 'Activities',
};

const CATEGORY_FACULTY_UID = {
  1: 'fac0001',
  2: 'fac0002',
  3: 'fac0003',
  4: 'fac0004',
  5: 'fac0005',
  6: 'fac0006',
};
/* ================================
   SIMPLE HELPERS
================================== */
function isPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}
/* ================================
   LOCATION HELPERS (location_id)
================================== */

async function isValidLocationId(location_id) {
  if (!location_id) return false;
  const [rows] = await pool.query(
    `SELECT 1 FROM campus_locations WHERE location_id = ? LIMIT 1`,
    [location_id]
  );
  return rows.length > 0;
}

async function getLocationLabel(location_id) {
  const [rows] = await pool.query(
    `SELECT location_name, building, room
     FROM campus_locations
     WHERE location_id = ?
     LIMIT 1`,
    [location_id]
  );
  const loc = rows[0];
  if (!loc) return `Location #${location_id}`;

  const parts = [];
  if (loc.location_name) parts.push(loc.location_name);
  if (loc.building) parts.push(loc.building);
  if (loc.room) parts.push(`Room ${loc.room}`);
  return parts.join(', ');
}

/**
 * Check if any OTHER event at same location_id overlaps in time.
 * Overlap condition:
 *   NOT (existing.end <= new.start OR existing.start >= new.end)
 */
async function hasOverlappingEventAtLocation(location_id, startTime, endTime, excludeEventId = null) {
  if (!location_id || !startTime || !endTime) return false;

  let sql = `
    SELECT COUNT(*) AS cnt
    FROM events
    WHERE location_id = ?
      AND NOT (end_datetime <= ? OR start_datetime >= ?)
  `;
  const params = [location_id, startTime, endTime];

  if (excludeEventId) {
    sql += ' AND event_id <> ?';
    params.push(excludeEventId);
  }

  const [rows] = await pool.query(sql, params);
  const count = rows[0]?.cnt || 0;
  return count > 0;
}

// Email sending helper functions

async function sendEventCreationEmails(event, notifiedUsers, locationLabel) {
  try {
    const emailRecipients = getEmailRecipients(notifiedUsers);
    if (emailRecipients.length === 0) return;

    const subject = `New Event: ${event.title}`;
    const html = `
      <p>A new event has been created:</p>
      <p><strong>${event.title}</strong></p>
      <p>${event.description}</p>
      <p><strong>When:</strong> ${event.start_datetime} - ${event.end_datetime}</p>
      <p><strong>Where:</strong> ${locationLabel}</p>
    `;

    await sendEmail({ to: emailRecipients.join(','), subject, html });
  } catch (err) {
    console.error('Error sending event creation emails:', err);
  }
}

async function sendEventUpdateEmails(event, registeredUsers, locationLabel) {
  try {
    const emailRecipients = getEmailRecipients(registeredUsers);
    if (emailRecipients.length === 0) return;

    const subject = `Event Updated: ${event.title}`;
    const html = `
      <p>The event "<strong>${event.title}</strong>" has been updated.</p>
      <p>New details:</p>
      <p>${event.description}</p>
      <p><strong>When:</strong> ${event.start_datetime} - ${event.end_datetime}</p>
      <p><strong>Where:</strong> ${locationLabel}</p>
    `;

    await sendEmail({ to: emailRecipients.join(','), subject, html });
  } catch (err) {
    console.error('Error sending event update emails:', err);
  }
}

async function sendEventDeletionEmails(event, registeredUsers) {
  try {
    const emailRecipients = getEmailRecipients(registeredUsers);
    if (emailRecipients.length === 0) return;

    const subject = `Event Cancelled: ${event.title}`;
    const html = `
      <p>The event "<strong>${event.title}</strong>" you registered for has been cancelled.</p>
      <p>We apologize for any inconvenience.</p>
    `;

    await sendEmail
    ({ to: emailRecipients.join(','), subject, html });
  } catch (err) {
    console.error('Error sending event deletion emails:', err);
  }
}

/* ================================
   GET /api/events
   Return ALL events + registered_count
   + campus location detailsconst
================================== */
router.get('/', async (req, res) => {
  const query = `
    SELECT 
      e.*,
      cl.location_name,
      cl.building,
      cl.room,
      (
        SELECT COUNT(*) 
        FROM event_registrations er 
        WHERE er.event_id = e.event_id
      ) AS registered_count
    FROM events e
    LEFT JOIN campus_locations cl
      ON cl.location_id = e.location_id
    ORDER BY e.start_datetime DESC
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    console.error('Events fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

/* ================================
   GET all registered users for ONE event
   GET /api/events/:event_id/registrations
================================== */
router.get('/:event_id/registrations', async (req, res) => {
  const eventId = req.params.event_id;

  if (!isPositiveInt(eventId)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  const query = `
    SELECT 
      u.user_id,
      u.user_uid,
      u.first_name,
      u.last_name,
      u.email,
      r.role_name
    FROM event_registrations er
    JOIN users u ON er.user_id = u.user_id
    JOIN roles r ON u.role_id = r.role_id
    WHERE er.event_id = ?
    ORDER BY u.first_name ASC
  `;

  try {
    const [rows] = await pool.query(query, [eventId]);
    res.json(rows);
  } catch (err) {
    console.error('Fetch event members error:', err);
    res.status(500).json({ message: 'Failed to fetch event members', error: err.message });
  }
});

/* ================================
   GET all registered members for ONE event
   GET /api/events/:event_id/members
================================== */
router.get('/:event_id/members', async (req, res) => {
  const eventId = req.params.event_id;
    if (!isPositiveInt(eventId)) {
    return res.status(400).json({ message: 'Invalid event id.' });
  }


  try {
    const [rows] = await pool.query(
      `
      SELECT 
        u.user_id,
        u.user_uid,
        u.first_name,
        u.last_name,
        u.email,
        r.role_name,
        er.registered_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      WHERE er.event_id = ?
      ORDER BY er.registered_at ASC
      `,
      [eventId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Fetch event members error:', err);
    res.status(500).json({ message: 'Failed to fetch event members', error: err.message });
  }
});

/* ================================
   GET user registrations
   GET /api/events/registrations/:user_id
================================== */
router.get('/registrations/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT event_id FROM event_registrations WHERE user_id = ?';
  if (!isPositiveInt(userId)) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  try {
    const [results] = await pool.query(query, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Registration fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
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

    if (!eventId || !user_id || !Number.isInteger(Number(user_id)) || Number(user_id) <= 0) {
      return res.status(400).json({ message: 'Valid event_id and user_id are required' });
    }

    // Prevent duplicate registrations (DB insert)
    await pool.query(
      `INSERT IGNORE INTO event_registrations (event_id, user_id, registered_at) VALUES (?, ?, NOW())`,
      [eventId, user_id]
    );

    // Immediately return the updated count to the client (fast)
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS registered_count FROM event_registrations WHERE event_id = ?',
      [eventId]
    );
    const registered_count = rows[0]?.registered_count || 0;

    res.json({ registered_count });

    // Fire-and-forget: notifications & email (do not block response)
    (async () => {
      try {
        // Fetch event title (for message/email)
        const [eventRows] = await pool.query('SELECT title FROM events WHERE event_id = ?', [eventId]);
        const eventTitle = eventRows.length ? eventRows[0].title : `Event #${eventId}`;

        // Create notification (async)
        const notifMsg = `You have successfully registered for the event "${eventTitle}".`;
        try {
          await createNotification(user_id, notifMsg);
        } catch (nErr) {
          console.error('Async createNotification error:', nErr);
        }

        // Send confirmation email if user has email (async)
        try {
          const email = await getUserEmail(user_id);
          if (email) {
            const subject = `Registration Confirmed: ${eventTitle}`;
            const html = `<p>You have been registered for the event: <strong>${eventTitle}</strong>.</p>`;
            await sendEmail({ to: email, subject, html });
          }
        } catch (mailErr) {
          console.error('Async sendEmail error (registration):', mailErr);
        }
      } catch (asyncErr) {
        console.error('Async RSVP post-processing error:', asyncErr);
      }
    })();
  } catch (err) {
    console.error('RSVP register error:', err);
    res.status(500).json({ message: 'Failed to register for event', error: err.message });
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

    if (!eventId || !user_id || !Number.isInteger(Number(user_id)) || Number(user_id) <= 0) {
      return res.status(400).json({ message: 'Valid event_id and user_id are required' });
    }

    // Delete registration (DB operation)
    await pool.query(
      'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
      [eventId, user_id]
    );

    // Immediately return the updated count to the client (fast)
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS registered_count FROM event_registrations WHERE event_id = ?',
      [eventId]
    );
    const registered_count = rows[0]?.registered_count || 0;

    res.json({ registered_count });

    // Fire-and-forget: notifications & email (do not block response)
    (async () => {
      try {
        // Fetch event title (for message/email)
        const [eventRows] = await pool.query('SELECT title FROM events WHERE event_id = ?', [eventId]);
        const eventTitle = eventRows.length ? eventRows[0].title : `Event #${eventId}`;

        // Create notification (async)
        const notifMsg = `Your registration for the event "${eventTitle}" has been cancelled.`;
        try {
          await createNotification(user_id, notifMsg);
        } catch (nErr) {
          console.error('Async createNotification error (cancellation):', nErr);
        }

        // Send cancellation email if user has email (async)
        try {
          const email = await getUserEmail(user_id);
          if (email) {
            const subject = `Registration Cancelled: ${eventTitle}`;
            const html = `<p>Your registration for the event <strong>${eventTitle}</strong> has been cancelled.</p>`;
            await sendEmail({ to: email, subject, html });
          }
        } catch (mailErr) {
          console.error('Async sendEmail error (cancellation):', mailErr);
        }
      } catch (asyncErr) {
        console.error('Async RSVP delete post-processing error:', asyncErr);
      }
    })();
  } catch (err) {
    console.error('RSVP cancel error:', err);
    res.status(500).json({ message: 'Failed to cancel RSVP', error: err.message });
  }
});

/* ================================
   CREATE event
   POST /api/events
   - auto-approved
   - supports org_id + members_only
   - sends notifications
   - VALIDATES:
       * location_id exists
       * no overlapping events at same location_id
================================== */
router.post('/', async (req, res) => {
  const {
    title,
    description,
    start_datetime,
    end_datetime,
    location_id,
    capacity,
    category_id,
    registration_required,
    instructor_email,
    created_by,
    organization_id,
    members_only,
  } = req.body;

  // Basic validations
  if (
    !title ||
    !description ||
    !start_datetime ||
    !end_datetime ||
    !location_id ||
    !capacity ||
    !category_id ||
    !organization_id
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (
    !isPositiveInt(location_id) ||
    !isPositiveInt(category_id) ||
    !isPositiveInt(organization_id)
  ) {
    return res.status(400).json({ message: 'Invalid numeric fields' });
  }

  if (title.trim().length < 3)
    return res.status(400).json({ message: 'Title must be at least 3 characters long.' });
  if (description.trim().length < 10)
    return res.status(400).json({ message: 'Description must be at least 10 characters long.' });

  const capacityNum = Number(capacity);
  if (Number.isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
    return res
      .status(400)
      .json({ message: 'Capacity must be a number between 1 and 1000.' });
  }

  const start = new Date(start_datetime);
  const end = new Date(end_datetime);
  const now = new Date();

  if (Number.isNaN(start) || Number.isNaN(end))
    return res.status(400).json({ message: 'Invalid start or end date/time.' });

  if (end <= start)
    return res.status(400).json({ message: 'End time must be after start time.' });

  if (start <= now)
    return res.status(400).json({ message: 'Start time must be in the future.' });

  try {
    if (!(await isValidLocationId(location_id))) {
      return res.status(400).json({ message: 'Invalid location' });
    }

    if (
      await hasOverlappingEventAtLocation(
        location_id,
        start_datetime,
        end_datetime
      )
    ) {
      return res.status(400).json({
        message:
          'Another event at this location overlaps with the selected time. Please choose a different time or location.',
      });
    }

    const categoryName = CATEGORY_NAME_BY_ID[category_id] || null;
    const approverUid = CATEGORY_FACULTY_UID[category_id] || null;
    let approvedByUserId = null,
      approverEmail = null;

    if (approverUid) {
      const [facultyRows] = await pool.query(
        'SELECT user_id, email FROM users WHERE user_uid = ? LIMIT 1',
        [approverUid]
      );
      if (facultyRows.length) {
        approvedByUserId = facultyRows[0].user_id;
        approverEmail = facultyRows[0].email;
      }
    }

    const finalInstructorEmail = instructor_email || approverEmail || null;

    const membersOnlyValue =
      members_only === true || members_only === 1 || members_only === '1'
        ? 1
        : 0;

    const insertQuery = `
      INSERT INTO events
        (title, description, start_datetime, end_datetime, location_id,
        capacity, category_id, category, registration_required, instructor_email,
        created_by, approved_by, status, org_id, members_only)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
    `;

    const [results] = await pool.query(insertQuery, [
      title,
      description,
      start_datetime,
      end_datetime,
      location_id,
      capacityNum,
      category_id,
      categoryName,
      registration_required ? 1 : 0,
      finalInstructorEmail,
      created_by,
      approvedByUserId,
      organization_id,
      membersOnlyValue,
    ]);

    const newEventId = results.insertId;

    // Fetch inserted event with location fields and registered_count so client gets full object
    const [fetchedRows] = await pool.query(
      `
      SELECT 
        e.*,
        cl.location_name,
        cl.building,
        cl.room,
        (
          SELECT COUNT(*) 
          FROM event_registrations er 
          WHERE er.event_id = e.event_id
        ) AS registered_count
      FROM events e
      LEFT JOIN campus_locations cl
        ON cl.location_id = e.location_id
      WHERE e.event_id = ?
      LIMIT 1
      `,
      [newEventId]
    );

    const savedEvent = fetchedRows.length ? fetchedRows[0] : {
      event_id: newEventId,
      title,
      description,
      start_datetime,
      end_datetime,
      location_id,
      capacity: capacityNum,
      category_id,
      category: categoryName,
      registration_required: registration_required ? 1 : 0,
      instructor_email: finalInstructorEmail,
      created_by,
      approved_by: approvedByUserId,
      status: 'approved',
      org_id: organization_id,
      members_only: membersOnlyValue,
      location_name: null,
      building: null,
      room: null,
      registered_count: 0,
    };

    // Immediately respond with the full created event (fast response)
    res.status(201).json(savedEvent);

    // Fire-and-forget: notifications + emails (do not block the response)
    (async () => {
      try {
        // Notify creator
        try {
          await createNotification(
            created_by,
            `Your event "${title}" has been created.`
          );
        } catch (nErr) {
          console.error('Async createNotification (creator) error:', nErr);
        }

        // Determine recipients
        let notifiedUsers;
        if (membersOnlyValue) {
          const [members] = await pool.query(
            `SELECT u.user_id, u.email FROM organization_members om JOIN users u ON om.user_id = u.user_id WHERE om.org_id = ?`,
            [organization_id]
          );
          notifiedUsers = members;
        } else {
          const [users] = await pool.query(
            `SELECT user_id, email FROM users WHERE user_id != ?`,
            [created_by]
          );
          notifiedUsers = users;
        }

        const notifyMessage = `A new event "${title}" has been created.`;

        // Create notifications (async)
        try {
          await Promise.all(
            notifiedUsers.map((u) => createNotification(u.user_id, notifyMessage))
          );
        } catch (nErr2) {
          console.error('Async createNotification (recipients) error:', nErr2);
        }

        // Send event creation emails (async)
        try {
          await sendEventCreationEmails(
            { title, description, start_datetime, end_datetime },
            notifiedUsers,
            await getLocationLabel(location_id)
          );
        } catch (mailErr) {
          console.error('Async sendEventCreationEmails error:', mailErr);
        }
      } catch (asyncErr) {
        console.error('Async post-create processing error:', asyncErr);
      }
    })();
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

/* ================================
   UPDATE event (admin/creator)
   PUT /api/events/:event_id
   - Notify after update
   - VALIDATES:
       * location_id exists
       * no overlapping events at same location_id
================================== */
// --- UPDATE Event route ---
router.put('/:event_id', async (req, res) => {
  const eventId = req.params.event_id;

  const {
    title,
    description,
    start_datetime,
    end_datetime,
    location_id,
    capacity,
    category_id,
    registration_required,
    instructor_email,
  } = req.body;

  if (!isPositiveInt(eventId))
    return res.status(400).json({ message: 'Invalid event id.' });

  if (
    !title ||
    !description ||
    !start_datetime ||
    !end_datetime ||
    !location_id ||
    !capacity ||
    !category_id
  ) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  if (title.trim().length < 3)
    return res
      .status(400)
      .json({ message: 'Title must be at least 3 characters long.' });
  if (description.trim().length < 10)
    return res
      .status(400)
      .json({ message: 'Description must be at least 10 characters long.' });

  const capacityNum = Number(capacity);
  if (Number.isNaN(capacityNum) || capacityNum < 1 || capacityNum > 1000) {
    return res
      .status(400)
      .json({ message: 'Capacity must be a number between 1 and 1000.' });
  }

  const start = new Date(start_datetime);
  const end = new Date(end_datetime);

  if (Number.isNaN(start) || Number.isNaN(end))
    return res.status(400).json({ message: 'Invalid start or end date/time.' });

  if (end <= start)
    return res.status(400).json({ message: 'End time must be after start time.' });

  try {
    if (!(await isValidLocationId(location_id)))
      return res.status(400).json({ message: 'Invalid location' });

    if (
      await hasOverlappingEventAtLocation(
        location_id,
        start_datetime,
        end_datetime,
        eventId
      )
    ) {
      return res.status(400).json({
        message:
          'Another event at this location overlaps with the selected time. Please choose a different time or location.',
      });
    }

    await pool.query(
      `UPDATE events SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, location_id = ?, capacity = ?, category_id = ?, registration_required = ?, instructor_email = ? WHERE event_id = ?`,
      [
        title,
        description,
        start_datetime,
        end_datetime,
        location_id,
        capacityNum,
        category_id,
        registration_required ? 1 : 0,
        instructor_email,
        eventId,
      ]
    );

    // Fetch updated event for notifications
    const [rows] = await pool.query(`SELECT * FROM events WHERE event_id = ?`, [
      eventId,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Event not found after update' });
    const event = rows[0];
    const locationLabel = await getLocationLabel(event.location_id);

    // Notify creator
    await createNotification(
      event.created_by,
      `Your event "${event.title}" has been updated.`
    );

    // Notify registered users except creator
    const [registeredUsers] = await pool.query(
      `SELECT u.user_id, u.email FROM event_registrations er JOIN users u ON er.user_id = u.user_id WHERE er.event_id = ? AND er.user_id != ?`,
      [eventId, event.created_by]
    );

    const notifyMsg = `Event "${event.title}" has been updated.`;
    await Promise.all(
      registeredUsers.map((u) => createNotification(u.user_id, notifyMsg))
    );

    // Send event update emails
    await sendEventUpdateEmails(event, registeredUsers, locationLabel);

    res.json({ message: 'Event updated successfully', event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
});

/* ================================
   DELETE / CANCEL event (hard delete)
   DELETE /api/events/:event_id
   - Notify registered users before deletion
================================== */
// --- DELETE Event route ---
router.delete('/:event_id', async (req, res) => {
  const eventId = req.params.event_id;

  if (!isPositiveInt(eventId))
    return res.status(400).json({ message: 'Invalid event id.' });

  try {
    // Fetch event to get details for notifications
    const [eventRows] = await pool.query(`SELECT * FROM events WHERE event_id = ?`, [
      eventId,
    ]);
    if (!eventRows.length)
      return res.status(404).json({ message: 'Event not found' });
    const event = eventRows[0];

    // Fetch registered users
    const [registeredUsers] = await pool.query(
      `SELECT u.user_id, u.email FROM event_registrations er JOIN users u ON er.user_id = u.user_id WHERE er.event_id = ?`,
      [eventId]
    );

    // Send cancellation emails before deletion
    await sendEventDeletionEmails(event, registeredUsers);

    // Notify registered users via notifications
    const notifyMsg = 'The event you registered for has been cancelled.';
    await Promise.all(
      registeredUsers.map((u) => createNotification(u.user_id, notifyMsg))
    );

    // Delete registrations and event
    await pool.query(`DELETE FROM event_registrations WHERE event_id = ?`, [
      eventId,
    ]);
    await pool.query(`DELETE FROM events WHERE event_id = ?`, [eventId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
});

module.exports = router;
