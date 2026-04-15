const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const authMiddleware = require('./middleware/auth');
const menuRoutes = require('./routes/menu');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const userRoutes  = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

const app = express();
const configuredPort = Number(process.env.PORT);
// Port 5000 commonly collides with macOS AirPlay/AirTunes, so default the dev server to 5050.
const PORT = configuredPort && configuredPort !== 5000 ? configuredPort : 5050;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));


// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/reservations', reservationRoutes);
// app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

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

//Email services
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL,
      subject: `Contact Form: ${subject}`,
      text: `
      Name: ${name}
      Email: ${email}
      Phone: ${phone}

      Message:
      ${message}
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: err.message
    });
  }
});

//Checkout email
app.post("/api/checkout", async (req, res) => {
  const { name, email, pickup} = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL,
      to:  email,
      subject: `Food Pick-up for ${email}`,
      text: `Hi ${name}, Your food will be ready for pick-up at: ${pickup}!
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: err.message
    });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;
