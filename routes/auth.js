const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { buildAdminTokenClaims } = require('../auth/adminSession');
const db      = require('../database/db');
const { buildAdminTokenClaims } = require('../auth/adminSession');

const router       = express.Router();
const JWT_SECRET   = process.env.JWT_SECRET   || 'secretkey';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

const PASSWORD_RULES = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_MSG   = 'Password must be at least 8 characters and include one uppercase letter and one special character.';

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !email || !password) {
    return res.status(400).json({ message: 'First name, email, and password are required.' });
  }

  if (!PASSWORD_RULES.test(password)) {
    return res.status(400).json({ message: PASSWORD_MSG });
  }

  try {
    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name || '', email.toLowerCase(), hash, 'customer']
    );

    res.status(201).json({ message: 'Account created successfully.' });
  } catch (err) {
    console.error('POST /api/auth/signup error:', err);
    res.status(500).json({ message: 'Signup failed.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT user_id, first_name, last_name, email, password_hash, role, profile_picture FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id:              user.user_id,
        first_name:      user.first_name,
        last_name:       user.last_name,
        email:           user.email,
        role:            user.role,
        profile_picture: user.profile_picture || null,
      },
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
});
router.post('/admin-login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!password.trim()) {
    return res.status(400).json({ message: 'Enter the admin password to continue.' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'That admin password is incorrect.' });
  }

  const token = jwt.sign(
    buildAdminTokenClaims({ id: 'admin-user', name: 'Admin User' }),
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    message: 'Admin authentication successful.',
    token,
    user: {
      name: 'Admin User',
      role: 'admin'
    }
  });
});

module.exports = router;
