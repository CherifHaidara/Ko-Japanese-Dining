const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middleware/auth');
const menuRoutes = require('./routes/menu');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/menu', menuRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ko Japanese Dining API is running!' });
});

// Protected route
app.get('/private', authMiddleware, (req, res) => {
  res.json({
    message: 'You accessed a protected route',
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
