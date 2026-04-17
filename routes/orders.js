const express = require("express");
const router  = express.Router();
const db      = require("../database/db");
const adminGuard = require("../middleware/adminGuard");
const { sendOrderReadyEmail } = require("../utils/mailer");

// Valid status progression
const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

// ── GET /api/orders ─────────────────────────────────────────────────────────
// Returns all orders with their items, sorted newest first (admin only)
router.get("/", adminGuard, async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );

    const [items] = await db.query(
      "SELECT * FROM order_items"
    );

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items.filter(item => item.order_id === order.order_id)
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Creates a new order with its items
router.post("/", async (req, res) => {
  const { customer_id, customer_name, customer_email, total, notes, items } = req.body;

  if (!customer_name || !total || !items || items.length === 0) {
    return res.status(400).json({ message: "Missing required order fields." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO orders (customer_id, customer_name, customer_email, total, status, notes)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [customer_id || null, customer_name, customer_email || null, total, notes || null]
    );

    const orderId = result.insertId;

    for (const item of items) {
      const modifiers = item.modifiers
        ? JSON.stringify(item.modifiers)
        : null;

      await db.query(
        `INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, modifiers)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.item_id || null, item.item_name, item.item_price, item.quantity || 1, modifiers]
      );
    }

    res.status(201).json({ message: "Order placed successfully.", order_id: orderId });

  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ message: "Failed to place order." });
  }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
// Returns a single order with its items (public — customers use this to track)
router.get("/:id", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [req.params.id]
    );

    res.json({ ...orders[0], items });
  } catch (err) {
    console.error("GET /api/orders/:id error:", err);
    res.status(500).json({ message: "Failed to fetch order." });
  }
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Moves an order to a new status stage (admin only)
router.patch("/:id/status", adminGuard, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status || !STATUS_FLOW.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${STATUS_FLOW.join(", ")}`
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = rows[0];
    const currentStatus = order.status;

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const newIndex = STATUS_FLOW.indexOf(status);

    if (status !== "cancelled" && newIndex < currentIndex) {
      return res.status(400).json({
        message: `Cannot move order backwards from "${currentStatus}" to "${status}".`
      });
    }

    // update DB
    await db.query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      [status, orderId]
    );

    // ✅ SEND EMAIL ONLY WHEN READY
    if (
      status === "ready" &&
      currentStatus !== "ready" &&
      order.customer_email
    ) {
      try {
        await sendOrderReadyEmail({
          to: order.customer_email,
          name: order.customer_name,
          orderId
        });
      } catch (emailErr) {
        console.error("Email failed:", emailErr);
        // don't block API response if email fails
      }
    }

    res.json({
      message: `Order #${orderId} status updated to "${status}".`,
      order_id: parseInt(orderId),
      previous_status: currentStatus,
      new_status: status
    });

  } catch (err) {
    console.error("PATCH /api/orders/:id/status error:", err);
    res.status(500).json({ message: "Failed to update order status." });
  }
});

module.exports = router;
