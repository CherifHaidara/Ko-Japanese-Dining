const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const db = require('../database/db');

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

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
// Returns sales totals, order counts by status, and top items for a date range.
// Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)  — both optional
router.get('/analytics', adminGuard, async (req, res) => {
  try {
    // Default to last 30 days if no range provided
    const end   = req.query.end   ? `${req.query.end} 23:59:59`   : new Date().toISOString().slice(0, 19).replace('T', ' ');
    const start = req.query.start ? `${req.query.start} 00:00:00` : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    })();

    // 1. Sales totals
    const [[totals]] = await db.query(
      `SELECT
         COUNT(*)                                        AS total_orders,
         COALESCE(SUM(total), 0)                        AS total_revenue,
         COALESCE(AVG(total), 0)                        AS avg_order_value,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) AS completed_revenue
       FROM orders
       WHERE created_at BETWEEN ? AND ?`,
      [start, end]
    );

    // 2. Order counts by status
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM orders
       WHERE created_at BETWEEN ? AND ?
       GROUP BY status`,
      [start, end]
    );

    // 3. Top items by total quantity sold
    const [topItems] = await db.query(
      `SELECT
         oi.item_name,
         SUM(oi.quantity)                        AS total_quantity,
         SUM(oi.quantity * oi.item_price)        AS total_revenue,
         COUNT(DISTINCT oi.order_id)             AS order_count
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE o.created_at BETWEEN ? AND ?
       GROUP BY oi.item_name
       ORDER BY total_quantity DESC
       LIMIT 10`,
      [start, end]
    );

    // 4. Order volume by day
    const [ordersByDay] = await db.query(
      `SELECT
         DATE(created_at)        AS date,
         COUNT(*)                AS order_count,
         COALESCE(SUM(total), 0) AS daily_revenue
       FROM orders
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [start, end]
    );

    res.json({
      date_range: { start, end },
      totals: {
        total_orders:      Number(totals.total_orders),
        total_revenue:     Number(totals.total_revenue),
        avg_order_value:   Number(totals.avg_order_value),
        completed_revenue: Number(totals.completed_revenue)
      },
      orders_by_status: statusCounts.map(r => ({
        status: r.status,
        count:  Number(r.count)
      })),
      top_items: topItems.map(r => ({
        item_name:      r.item_name,
        total_quantity: Number(r.total_quantity),
        total_revenue:  Number(r.total_revenue),
        order_count:    Number(r.order_count)
      })),
      orders_by_day: ordersByDay.map(r => ({
        date:          r.date instanceof Date
                         ? r.date.toISOString().slice(0, 10)
                         : String(r.date).slice(0, 10),
        order_count:   Number(r.order_count),
        daily_revenue: Number(r.daily_revenue)
      }))
    });

  } catch (err) {
    console.error('GET /api/admin/analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
});

module.exports = router;