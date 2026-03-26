const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const orders = [
  {
    id: 1,
    customerName: "John Doe",
    items: ["Salmon Nigiri", "Roll"],
    total: 20,
    status: "Pending"
  }
];

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

router.get('/orders', auth, adminOnly, (req, res) => {
  res.json(orders);
});

router.patch('/orders/:id/status', auth, adminOnly, (req, res) => {
  const order = orders.find(o => o.id == req.params.id);

  if (!order) return res.status(404).json({ message: 'Not found' });

  order.status = req.body.status;

  res.json({ message: 'Updated', order });
});

module.exports = router;