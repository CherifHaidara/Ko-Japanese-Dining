const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// GET /api/menu/full?menu=Dinner
// Returns all sections and items for a given menu category
router.get('/full', async (req, res) => {
  const menuName = req.query.menu || 'Dinner';

  try {
    const [categories] = await db.query(
      'SELECT category_id, name FROM menu_categories WHERE name = ? AND is_active = TRUE',
      [menuName]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: `Menu "${menuName}" not found.` });
    }

    const category = categories[0];

    const [sections] = await db.query(
      'SELECT section_id, name FROM menu_sections WHERE category_id = ? AND is_active = TRUE ORDER BY display_order',
      [category.category_id]
    );

    const result = [];

    for (const section of sections) {
      const [items] = await db.query(
        `SELECT item_id, name, description, price, image_url, is_featured, display_order
         FROM menu_items
         WHERE section_id = ? AND is_available = TRUE
         ORDER BY display_order`,
        [section.section_id]
      );

      result.push({
        section: section.name,
        items: items.map(item => ({
          id:          item.item_id,
          name:        item.name,
          description: item.description,
          price:       parseFloat(item.price),
          image_url:   item.image_url,
          is_featured: item.is_featured === 1
        }))
      });
    }

    res.json({ menu: menuName, sections: result });

  } catch (err) {
    console.error('GET /api/menu/full error:', err);
    res.status(500).json({ message: 'Failed to load menu.' });
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
