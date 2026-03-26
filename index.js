const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middleware/auth');
const menuRoutes = require('./routes/menu');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/reservations', reservationRoutes);
// app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ko Japanese Dining API is running!' });
});

// Protected route example
app.get('/private', authMiddleware, (req, res) => {
  res.json({
    message: 'You accessed a protected route',
    user: req.user
  });
});

app.get('/dev/admin-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: 1, name: 'Test Admin', role: 'admin' },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '24h' }
  );
  res.json({ token });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
