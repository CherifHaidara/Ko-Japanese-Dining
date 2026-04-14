const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const orders = [
  {
    id: 1,
    customerName: "John Doe",
    customerEmail: "john@example.com",
    items: [
      { name: "Salmon Nigiri", quantity: 2, price: 5 },
      { name: "California Roll", quantity: 1, price: 10 }
    ],
    total: 20,
    status: "Pending",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    items: [
      { name: "Tuna Nigiri", quantity: 1, price: 6 }
    ],
    total: 6,
    status: "Preparing",
    createdAt: new Date().toISOString()
  }
];

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

// GET /api/admin/orders
router.get('/orders', auth, adminOnly, (req, res) => {
  res.json(orders);
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', auth, adminOnly, (req, res) => {
  const order = orders.find(o => o.id == req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  order.status = req.body.status;

  res.json({
    message: 'Order status updated successfully',
    order
  });
});

// GET /api/admin/sales-summary
router.get('/sales-summary', auth, adminOnly, (req, res) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const completedOrders = orders.filter(order => order.status === 'Completed').length;
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;

  res.json({
    totalOrders,
    totalRevenue,
    completedOrders,
    pendingOrders
  });
});

module.exports = router;