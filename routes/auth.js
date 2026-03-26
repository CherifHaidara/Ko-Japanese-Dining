const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

router.post('/admin-login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!password.trim()) {
    return res.status(400).json({ message: 'Enter the admin password to continue.' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'That admin password is incorrect.' });
  }

  const token = jwt.sign(
    { id: 'admin-user', name: 'Admin User', role: 'admin' },
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
