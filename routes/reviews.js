const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// GET reviews for a menu item
router.get('/:itemId', async (req, res) => {
  const db = req.app.get('db'); // or your mysql pool
  const { itemId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT r.*, u.first_name
       FROM menu_reviews r
       LEFT JOIN users u ON r.user_id = u.user_id
       WHERE r.item_id = ?
       ORDER BY r.created_at DESC`,
      [itemId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a review (logged in users only)
router.post('/', authMiddleware, async (req, res) => {
  const db = req.app.get('db');
  const { item_id, rating, comment } = req.body;

  try {
    await db.query(
      `INSERT INTO menu_reviews (item_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [item_id, req.user.user_id, rating, comment]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET average rating for an item
router.get('/summary/:itemId', async (req, res) => {
  const db = req.app.get('db');
  const { itemId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
          COUNT(*) as count,
          AVG(rating) as average
       FROM menu_reviews
       WHERE item_id = ?`,
      [itemId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;