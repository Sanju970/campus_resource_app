const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Helper: map numeric role_id → string
const roleNameFromId = (id) => {
  switch (Number(id)) {
    case 1:
      return 'student';
    case 2:
      return 'faculty';
    case 3:
      return 'admin';
    default:
      return 'unknown';
  }
};

// -------------------- REGISTER --------------------
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

    db.query(
      sql,
      [first_name, last_name, user_uid, email.toLowerCase(), hashedPassword, role_id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email or User ID already exists' });
          }
          console.error('DB Insert Error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }

        const newUser = {
          user_id: result.insertId,
          first_name,
          last_name,
          user_uid,
          email: email.toLowerCase(),
          role_id,
          role: roleNameFromId(role_id),
        };

        res.status(201).json({ message: 'User registered successfully', user: newUser });
      }
    );
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

  const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;

  db.query(sql, [email.toLowerCase()], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Optional: verify role
    if (role && Number(user.role_id) !== Number(role)) {
      return res.status(403).json({ message: 'Invalid role selected' });
    }

    // Generate JWT
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
      role: roleNameFromId(user.role_id),
    };

    res.json({
      message: 'Login successful',
      token,
      user: loggedInUser,
    });
  });
});

module.exports = router;
