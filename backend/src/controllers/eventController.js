const pool = require('../config/db');

const createEvent = async (req, res) => {
  try {
    const { title, description, start_datetime, end_datetime, location, capacity, category, instructor_email, registration_required } = req.body;
    const created_by = req.user.user_id;
    const role = req.user.role;
    const status = role === 'student' ? 'pending' : 'approved';
    const approved_by = role === 'student' ? null : created_by;

    const [result] = await pool.query(`
      INSERT INTO events (title, description, start_datetime, end_datetime, location, capacity, category, instructor_email, registration_required, created_by, approved_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, start_datetime, end_datetime, location, capacity, category, instructor_email, registration_required ? 1 : 0, created_by, approved_by, status]);

    const eventId = result.insertId;

    // If approved immediately, create notifications for all users (except creator)
    if (status === 'approved') {
      await pool.query('INSERT INTO notifications (user_id, event_id, message) SELECT user_id, ?, ? FROM users WHERE user_id NOT IN (?)', [eventId, `New event posted: ${title}`, created_by]);
    }

    res.json({ event_id: eventId, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const approverId = req.user.user_id;
    // set event to approved
    await pool.query('UPDATE events SET status = ?, approved_by = ? WHERE event_id = ?', ['approved', approverId, eventId]);
    // create notifications for all users except creator
    const [evRows] = await pool.query('SELECT title, created_by FROM events WHERE event_id = ?', [eventId]);
    if (!evRows.length) return res.status(404).json({ message: 'Event not found' });
    const title = evRows[0].title;
    const createdBy = evRows[0].created_by;
    await pool.query('INSERT INTO notifications (user_id, event_id, message) SELECT user_id, ?, ? FROM users WHERE user_id NOT IN (?)', [eventId, `Event approved: ${title}`, createdBy]);
    res.json({ message: 'Event approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listEvents = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY start_datetime DESC LIMIT 200');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createEvent, approveEvent, listEvents };
