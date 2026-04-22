const express = require('express');
const router = express.Router();
const db = require('../database/db');
const adminGuard = require('../middleware/adminGuard');

async function loadSettings() {
  const [rows] = await db.query('SELECT key_name, value FROM restaurant_settings');
  const settings = {};
  for (const row of rows) {
    settings[row.key_name] = row.value;
  }
  return settings;
}

// GET /api/settings — public, used by reservation page
router.get('/', async (req, res) => {
  try {
    const raw = await loadSettings();
    res.json({
      opening_hour:              Number(raw.opening_hour),
      closing_hour:              Number(raw.closing_hour),
      slot_interval_minutes:     Number(raw.slot_interval_minutes),
      max_seats_per_slot:        Number(raw.max_seats_per_slot),
      large_party_min:           Number(raw.large_party_min),
      modification_cutoff_hours: Number(raw.modification_cutoff_hours),
    });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ message: 'Failed to load settings.' });
  }
});

// PATCH /api/settings — admin only
router.patch('/', adminGuard, async (req, res) => {
  const allowed = new Set([
    'opening_hour', 'closing_hour', 'slot_interval_minutes',
    'max_seats_per_slot', 'large_party_min', 'modification_cutoff_hours',
  ]);

  const updates = Object.entries(req.body).filter(([k]) => allowed.has(k));
  if (updates.length === 0) {
    return res.status(400).json({ message: 'No valid settings provided.' });
  }

  try {
    for (const [key, value] of updates) {
      await db.query(
        'UPDATE restaurant_settings SET value = ? WHERE key_name = ?',
        [String(value), key]
      );
    }
    const raw = await loadSettings();
    res.json({
      message: 'Settings updated.',
      opening_hour:              Number(raw.opening_hour),
      closing_hour:              Number(raw.closing_hour),
      slot_interval_minutes:     Number(raw.slot_interval_minutes),
      max_seats_per_slot:        Number(raw.max_seats_per_slot),
      large_party_min:           Number(raw.large_party_min),
      modification_cutoff_hours: Number(raw.modification_cutoff_hours),
    });
  } catch (err) {
    console.error('PATCH /api/settings error:', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
});

module.exports = { router, loadSettings };
