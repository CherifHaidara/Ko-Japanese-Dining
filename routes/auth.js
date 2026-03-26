const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@ko.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  }
];

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find(u => u.email === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: 'customer'
  };

  users.push(newUser);

  res.status(201).json({ message: 'Account created successfully.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secretkey'
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      role: user.role
    }
  });
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
