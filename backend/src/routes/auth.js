// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// -------------------- REGISTER (SIGNUP) --------------------
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, user_uid, email, password, role_id } = req.body;

    if (!first_name || !last_name || !user_uid || !email || !password || !role_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [first_name, last_name, user_uid, email.toLowerCase(), hashedPassword, role_id], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email or User ID already exists' });
        }
        console.error('Register DB Error:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      const newUser = {
        user_id: result.insertId,
        first_name,
        last_name,
        user_uid,
        email: email.toLowerCase(),
        role_id,
      };

      res.status(201).json({ message: 'User registered successfully', user: newUser });
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// -------------------- LOGIN --------------------
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const sql = `SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1`;

  db.query(sql, [email.toLowerCase()], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (role && Number(user.role_id) !== Number(role)) {
      return res.status(403).json({ message: 'Invalid role selected' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const loggedInUser = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      user_uid: user.user_uid,
      email: user.email,
      role_id: user.role_id,
      role: user.role_id === 1 ? 'student' : user.role_id === 2 ? 'faculty' : 'admin',
      name: `${user.first_name} ${user.last_name}`,
    };

    res.json({
      message: 'Login successful',
      token,
      user: loggedInUser,
    });
  });
});

// -------------------- CHANGE PASSWORD --------------------
router.post('/change-password', async (req, res) => {
  try {
    const { user_id, oldPassword, newPassword } = req.body;

    if (!user_id || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Strong password regex:
    // At least 8 chars, one uppercase, one lowercase, one number, one special character
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and include one uppercase letter, one number, and one special character.',
      });
    }

    const sql = `SELECT password_hash FROM users WHERE user_id = ? AND is_active = TRUE`;
    db.query(sql, [user_id], async (err, results) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found or inactive' });
      }

      const user = results[0];
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Incorrect old password' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      const updateSQL = `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?`;
      db.query(updateSQL, [newHash, user_id], (err2) => {
        if (err2) {
          console.error('Password update error:', err2);
          return res.status(500).json({ message: 'Error updating password' });
        }
        res.json({ message: 'Password updated successfully' });
      });
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
