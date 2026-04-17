const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getAvailableTags, getMenuItems, parseTagList } = require('../services/menuItems');

// GET /api/menu/full?menu=Dinner
// Returns all sections and items for a given menu category
router.get('/full', async (req, res) => {
  try {
    const menuName = req.query.menu || 'Dinner';
    const items = await getMenuItems({ menu: menuName });
    const sections = items.reduce((accumulator, item) => {
      const section = accumulator.find((entry) => entry.section === item.section_name);

      if (section) {
        section.items.push(item);
      } else {
        accumulator.push({
          section: item.section_name,
          items: [item],
        });
      }

      return accumulator;
    }, []);

    res.json({ menu: menuName, sections });
  } catch (err) {
    console.error('GET /api/menu/full error:', err);
    res.status(500).json({ message: 'Failed to load menu.' });
  }
});

// GET /api/menu/items?menu=Dinner&search=roll&tags=Vegetarian&tags=Gluten-Free
router.get('/items', async (req, res) => {
  try {
    const menu = req.query.menu || undefined;
    const search = req.query.search || req.query.q || '';
    const tags = parseTagList(req.query.tags);
    const items = await getMenuItems({ menu, search, tags });
    const availableTags = await getAvailableTags();

    res.json({
      menu: menu || null,
      search: String(search || ''),
      tags,
      items,
      available_tags: availableTags.map((tag) => tag.name),
    });
  } catch (err) {
    console.error('GET /api/menu/items error:', err);
    res.status(500).json({ message: 'Failed to load menu items.' });
  }
});

// GET /api/menu/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category_id, name, description FROM menu_categories WHERE is_active = TRUE ORDER BY display_order'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/menu/categories error:', err);
    res.status(500).json({ message: 'Failed to load categories.' });
  }
});

module.exports = router;
