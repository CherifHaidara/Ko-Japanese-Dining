const express = require('express');
const router = express.Router();
const db      = require('../database/db');

// ➕ Add review
router.post('/', async (req, res) => {
  const { item_id, user_id, rating, comment } = req.body;

  await db.query(
    `INSERT INTO item_reviews (item_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [item_id, user_id, rating, comment]
  );

  res.json({ success: true });
});

// 📥 Get reviews for item
router.get('/:itemId', async (req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM item_reviews
     WHERE item_id = ?
     ORDER BY created_at DESC`,
    [req.params.itemId]
  );

  res.json(rows);
});

// ⭐ Summary
router.get('/summary/:itemId', async (req, res) => {
  const [rows] = await db.query(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
     FROM item_reviews
     WHERE item_id = ?`,
    [req.params.itemId]
  );

  res.json(rows[0]);
});

module.exports = router;