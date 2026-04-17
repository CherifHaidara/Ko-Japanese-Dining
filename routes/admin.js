const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const db = require('../database/db');
const {
  ensureSectionExists,
  getAvailableTags,
  getMenuItemById,
  getMenuItems,
  getMenuSections,
  syncItemTags,
  validateMenuItemPayload,
} = require('../services/menuItems');

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

router.get('/menu/items', adminGuard, async (req, res) => {
  try {
    const [items, sections, tags] = await Promise.all([
      getMenuItems({ includeUnavailable: true }),
      getMenuSections(),
      getAvailableTags(),
    ]);

    res.json({
      items,
      sections,
      tags,
    });
  } catch (err) {
    console.error('GET /api/admin/menu/items error:', err);
    res.status(500).json({ message: 'Failed to load admin menu items.' });
  }
});

router.post('/menu/items', adminGuard, async (req, res) => {
  const { errors, data } = validateMenuItemPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  if (!(await ensureSectionExists(data.sectionId))) {
    return res.status(400).json({ message: 'Select a valid menu section.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO menu_items (
        section_id,
        name,
        description,
        price,
        image_url,
        is_available,
        is_featured,
        calories,
        display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sectionId,
        data.name,
        data.description,
        data.price,
        data.imageUrl || null,
        data.isAvailable,
        data.isFeatured,
        data.calories,
        data.displayOrder,
      ]
    );

    await syncItemTags(result.insertId, data.tags, connection);
    const item = await getMenuItemById(result.insertId, connection);

    await connection.commit();

    res.status(201).json({
      message: 'Menu item created.',
      item,
    });
  } catch (err) {
    await connection.rollback();
    console.error('POST /api/admin/menu/items error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to create menu item.' });
  } finally {
    connection.release();
  }
});

router.put('/menu/items/:itemId', adminGuard, async (req, res) => {
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: 'Select a valid menu item.' });
  }

  const existingItem = await getMenuItemById(itemId);

  if (!existingItem) {
    return res.status(404).json({ message: 'Menu item not found.' });
  }

  const { errors, data } = validateMenuItemPayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  if (!(await ensureSectionExists(data.sectionId))) {
    return res.status(400).json({ message: 'Select a valid menu section.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE menu_items
       SET
         section_id = ?,
         name = ?,
         description = ?,
         price = ?,
         image_url = ?,
         is_available = ?,
         is_featured = ?,
         calories = ?,
         display_order = ?
       WHERE item_id = ?`,
      [
        data.sectionId,
        data.name,
        data.description,
        data.price,
        data.imageUrl || null,
        data.isAvailable,
        data.isFeatured,
        data.calories,
        data.displayOrder,
        itemId,
      ]
    );

    await syncItemTags(itemId, data.tags, connection);
    const item = await getMenuItemById(itemId, connection);

    await connection.commit();

    res.json({
      message: 'Menu item updated.',
      item,
    });
  } catch (err) {
    await connection.rollback();
    console.error(`PUT /api/admin/menu/items/${itemId} error:`, err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to update menu item.' });
  } finally {
    connection.release();
  }
});

router.delete('/menu/items/:itemId', adminGuard, async (req, res) => {
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ message: 'Select a valid menu item.' });
  }

  try {
    const [result] = await db.query('DELETE FROM menu_items WHERE item_id = ?', [itemId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    res.json({
      message: 'Menu item deleted.',
      itemId,
    });
  } catch (err) {
    console.error(`DELETE /api/admin/menu/items/${itemId} error:`, err);
    res.status(500).json({ message: 'Failed to delete menu item.' });
  }
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
