const express = require('express');
const router = express.Router();

// Mock data
const categories = [
  { id: 1, name: "Sushi" },
  { id: 2, name: "Drinks" }
];

const sections = {
  1: [
    { id: 101, name: "Nigiri" },
    { id: 102, name: "Rolls" }
  ],
  2: [
    { id: 201, name: "Soft Drinks" },
    { id: 202, name: "Alcohol" }
  ]
};

const items = {
  101: [
    { id: 1001, name: "Salmon Nigiri", price: 5 },
    { id: 1002, name: "Tuna Nigiri", price: 6 }
  ],
  102: [
    { id: 1003, name: "California Roll", price: 8 }
  ]
};

// GET /api/menu/categories
router.get('/categories', (req, res) => {
  res.json(categories);
});

// GET /api/menu/sections/:categoryId
router.get('/sections/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  res.json(sections[categoryId] || []);
});

// GET /api/menu/items/:sectionId
router.get('/items/:sectionId', (req, res) => {
  const sectionId = req.params.sectionId;
  res.json(items[sectionId] || []);
});

module.exports = router;
