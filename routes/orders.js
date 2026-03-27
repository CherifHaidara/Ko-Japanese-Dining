const express = require("express");
const router  = express.Router();
const adminGuard = require("../middleware/adminGuard");
const { listOrders, updateOrderStatus } = require("../database/ordersStore");

// Valid status progression
const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

// ── GET /api/orders ─────────────────────────────────────────────────────────
// Returns all orders sorted newest first (admin only)
router.get("/", adminGuard, async (req, res) => {
  try {
    const result = await listOrders();

    if (result.source === "demo" && result.message) {
      res.set("X-Orders-Source", "demo");
      res.set("X-Orders-Message", result.message);
    }

    res.json(result.orders);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
// Moves an order to a new status stage (admin only)
router.patch("/:id/status", adminGuard, async (req, res) => {
  const orderId   = req.params.id;
  const { status } = req.body;

  // Validate the incoming status value
  if (!status || !STATUS_FLOW.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${STATUS_FLOW.join(", ")}`
    });
  }

  try {
    const result = await updateOrderStatus(orderId, status);

    if (result.source === "demo" && result.message) {
      res.set("X-Orders-Source", "demo");
      res.set("X-Orders-Message", result.message);
    }

    res.json({
      message: `Order #${orderId} status updated to "${status}".`,
      order_id: result.order_id,
      previous_status: result.previous_status,
      new_status: result.new_status
    });

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    console.error("PATCH /api/orders/:id/status error:", err);
    res.status(500).json({ message: "Failed to update order status." });
  }
});

module.exports = router;
