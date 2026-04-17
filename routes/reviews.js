const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../database/db');

// GET reviews for a menu item
router.get('/:itemId', async (req, res) => {
  const { itemId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        r.review_id,
        r.item_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        u.email AS user_name
      FROM item_reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.item_id = ?
      ORDER BY r.created_at DESC
      `,
      [itemId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET reviews error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { item_id, rating, comment } = req.body;

  try {
    const [result] = await db.query(
      `
      INSERT INTO item_reviews (item_id, rating, comment)
      VALUES (?, ?, ?)
      `,
      [item_id, rating, comment]
    );

    res.json({ success: true, review_id: result.insertId });
  } catch (err) {
    console.error('POST review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST a review (logged in users only)
router.post('/', authMiddleware, async (req, res) => {
  const { item_id, rating, comment } = req.body;

  try {
    await db.query(
      `INSERT INTO item_reviews (item_id, user_id, rating, comment)
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
  const { itemId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
          COUNT(*) as count,
          AVG(rating) as average
       FROM item_reviews
       WHERE item_id = ?`,
      [itemId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;