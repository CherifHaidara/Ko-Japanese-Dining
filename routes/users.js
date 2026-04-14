const express        = require('express');
const bcrypt         = require('bcryptjs');
const multer         = require('multer');
const path           = require('path');
const db             = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const PASSWORD_RULES = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_MSG   = 'Password must be at least 8 characters and include one uppercase letter and one special character.';

// ── Multer config — store uploads in /uploads, rename to user_<id>.<ext> ────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WebP images are allowed.'));
  },
});

// ── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, first_name, last_name, email, dietary_notes, profile_picture, created_at FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/users/me error:', err);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// ── PATCH /api/users/me ──────────────────────────────────────────────────────
router.patch('/me', authMiddleware, async (req, res) => {
  const { first_name, last_name, email, dietary_notes, current_password, new_password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];

    if (new_password) {
      if (!PASSWORD_RULES.test(new_password)) {
        return res.status(400).json({ message: PASSWORD_MSG });
      }
      if (!current_password) {
        return res.status(400).json({ message: 'Current password is required to set a new one.' });
      }
      const match = await bcrypt.compare(current_password, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    if (email && email.toLowerCase() !== user.email) {
      const [existing] = await db.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email.toLowerCase(), req.user.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'That email is already in use.' });
      }
    }

    const updatedFirst = first_name    ?? user.first_name;
    const updatedLast  = last_name     ?? user.last_name;
    const updatedEmail = email         ? email.toLowerCase() : user.email;
    const updatedNotes = dietary_notes ?? user.dietary_notes;
    const updatedHash  = new_password
      ? await bcrypt.hash(new_password, 10)
      : user.password_hash;

    await db.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, dietary_notes = ?, password_hash = ?
       WHERE user_id = ?`,
      [updatedFirst, updatedLast, updatedEmail, updatedNotes, updatedHash, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id:              req.user.id,
        first_name:      updatedFirst,
        last_name:       updatedLast,
        email:           updatedEmail,
        dietary_notes:   updatedNotes,
        profile_picture: user.profile_picture,
      },
    });
  } catch (err) {
    console.error('PATCH /api/users/me error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ── POST /api/users/me/avatar ────────────────────────────────────────────────
router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filename = req.file.filename;

  try {
    await db.query(
      'UPDATE users SET profile_picture = ? WHERE user_id = ?',
      [filename, req.user.id]
    );

    res.json({
      message: 'Profile picture updated.',
      profile_picture: filename,
    });
  } catch (err) {
    console.error('POST /api/users/me/avatar error:', err);
    res.status(500).json({ message: 'Failed to save profile picture.' });
  }
});

module.exports = router;
