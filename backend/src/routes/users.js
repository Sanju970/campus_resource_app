// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const router = express.Router();

// -------------------- ADMIN: FETCH USERS --------------------
router.get('/admin/users', (req, res) => {
  const includeAll = req.query.all === 'true';
  const sql = includeAll
    ? `SELECT user_id, first_name, last_name, user_uid, email, role_id, is_active FROM users`
    : `SELECT user_id, first_name, last_name, user_uid, email, role_id, is_active FROM users WHERE is_active = TRUE`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Fetch users error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    const formatted = results.map((row) => ({
      ...row,
      is_active: !!row.is_active,
    }));

    res.json(formatted);
  });
});

// -------------------- ADMIN: CREATE USER --------------------
router.post('/admin/create', async (req, res) => {
  try {
    const { first_name, last_name, user_uid, email, password, role_id } = req.body;
    if (!first_name || !last_name || !user_uid || !email || !role_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate dummy password if not provided
    const plainPassword =
      password && password.trim().length >= 6
        ? password
        : Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [first_name, last_name, user_uid, email.toLowerCase(), hashedPassword, role_id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email or User ID already exists' });
          }
          console.error('Create user DB error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(201).json({
          message: 'User created successfully',
          user: {
            user_id: result.insertId,
            first_name,
            last_name,
            user_uid,
            email,
            role_id,
            dummy_password: plainPassword,
          },
        });
      }
    );
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// -------------------- ADMIN: DEACTIVATE USER --------------------
router.patch('/admin/users/:id/deactivate', (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE user_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Deactivate error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deactivated successfully' });
  });
});

// -------------------- ADMIN: REACTIVATE USER --------------------
router.patch('/admin/users/:id/activate', (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE user_id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Activate error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User reactivated successfully' });
  });
});

module.exports = router;
