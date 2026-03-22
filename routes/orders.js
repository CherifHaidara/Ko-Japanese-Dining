const express = require("express");
const router  = express.Router();
const db      = require("../database/db");
const adminGuard = require("../middleware/adminGuard");

// Valid status progression
const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

// ── GET /api/orders ─────────────────────────────────────────────────────────
// Returns all orders sorted newest first (admin only)
router.get("/", adminGuard, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json(rows);
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
    // Confirm order exists
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const currentStatus = rows[0].status;

    // Prevent moving backwards (except to cancelled which is always allowed)
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const newIndex     = STATUS_FLOW.indexOf(status);

    if (status !== "cancelled" && newIndex < currentIndex) {
      return res.status(400).json({
        message: `Cannot move order backwards from "${currentStatus}" to "${status}".`
      });
    }

    // Apply the update
    await db.query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      [status, orderId]
    );

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
