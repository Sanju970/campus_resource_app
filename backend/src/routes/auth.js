const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// -------------------- REGISTER --------------------
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, user_uid, password } = req.body;

    // Trim and clean inputs
    const cleanFirst = (first_name || '').trim();
    const cleanLast = (last_name || '').trim();
    const cleanUid = (user_uid || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Required fields check
    if (!cleanFirst || !cleanLast || !cleanUid || !cleanPass) {
      return res.status(400).json({
        message: 'First name, last name, User ID, and password are required fields.',
      });
    }

    // Validate UID pattern
    const uidPattern = /^(stu|fac|adm)\d{4,5}$/; // prefix + 4–5 digits only
    if (!uidPattern.test(cleanUid)) {
      return res.status(400).json({
        message:
          'Invalid User ID format. It must start with stu/fac/adm followed by 4 or 5 digits (e.g., stu1234, fac98765).',
      });
    }

    // Extract role based on prefix
    let role_id = 0;
    if (cleanUid.startsWith('stu')) role_id = 1;
    else if (cleanUid.startsWith('fac')) role_id = 2;
    else if (cleanUid.startsWith('adm')) role_id = 3;

    // Strong password validation
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(cleanPass)) {
      return res.status(400).json({
        message:
          'Password must include at least 8 characters, one uppercase letter, one number, and one special character.',
      });
    }

    // Auto-generate campus email
    const email = `${cleanUid}@campus.edu`;

    // Hash password
    const hashedPassword = await bcrypt.hash(cleanPass, 10);

    // Insert user
    const sql = `
      INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [cleanFirst, cleanLast, cleanUid, email, hashedPassword, role_id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'User ID or email already exists.' });
          }
          console.error('Register DB Error:', err);
          return res.status(500).json({ message: 'Database error.', error: err.message });
        }

        res.status(201).json({
          message: 'User registered successfully.',
          user: {
            user_id: result.insertId,
            first_name: cleanFirst,
            last_name: cleanLast,
            user_uid: cleanUid,
            email,
            role_id,
            created_at: new Date()
          },
        });
      }
    );
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// -------------------- LOGIN --------------------
// router.use((req, res, next) => {
//   console.log('➡', req.method, req.url);
//   next();
// });

router.post('/login', (req, res) => {
  const { emailOrUid, password } = req.body;
  if (!emailOrUid || !password) {
    return res.status(400).json({ message: 'Email/User IDs and password are required.' });
  }

  // Accept both UID or email
  const identifier = String(emailOrUid || '').trim().toLowerCase();
  console.error(identifier);
  const lookupQuery = identifier.includes('@')
    ? 'SELECT * FROM users WHERE email = ? AND is_active = TRUE LIMIT 1'
    : 'SELECT * FROM users WHERE user_uid = ? AND is_active = TRUE LIMIT 1';

  db.query(lookupQuery, [identifier], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        user_uid: user.user_uid,
        email: user.email,
        role_id: user.role_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role:
          user.role_id === 1 ? 'student' : user.role_id === 2 ? 'faculty' : 'admin',
      },
    });
  });
});

module.exports = router;
