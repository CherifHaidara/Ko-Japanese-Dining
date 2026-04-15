const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const rewards = [
  { id: 1, name: 'Free Miso Soup', cost: 15 },
  { id: 2, name: '10% Off Order', cost: 30 },
  { id: 3, name: 'Free Sushi Roll', cost: 50 }
];

// GET /api/loyalty/rewards
router.get('/rewards', authMiddleware, async (req, res) => {
  res.json(rewards);
});

// GET /api/loyalty/balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT loyalty_points FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ points: rows[0].loyalty_points });
  } catch (err) {
    console.error('GET /api/loyalty/balance error:', err);
    res.status(500).json({ message: 'Failed to load loyalty balance.' });
  }
});

// POST /api/loyalty/redeem
router.post('/redeem', authMiddleware, async (req, res) => {
  const { rewardId } = req.body;
  const reward = rewards.find(r => r.id === rewardId);

  if (!reward) {
    return res.status(404).json({ message: 'Reward not found.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT loyalty_points FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentPoints = rows[0].loyalty_points;

    if (currentPoints < reward.cost) {
      return res.status(400).json({ message: 'Not enough points.' });
    }

    await db.query(
      'UPDATE users SET loyalty_points = loyalty_points - ? WHERE user_id = ?',
      [reward.cost, req.user.id]
    );

    res.json({
      message: `${reward.name} redeemed successfully.`,
      remainingPoints: currentPoints - reward.cost
    });
  } catch (err) {
    console.error('POST /api/loyalty/redeem error:', err);
    res.status(500).json({ message: 'Failed to redeem reward.' });
  }
});

module.exports = router;