const db = require('../database/db');

function parseTagList(input) {
  const values = Array.isArray(input) ? input : [input];

  return [...new Set(values
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean))];
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function formatMenuItem(row) {
  return {
    id: row.item_id,
    section_id: row.section_id,
    section_name: row.section_name,
    category_id: row.category_id,
    menu_name: row.menu_name,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    image_url: row.image_url || '',
    is_available: Boolean(row.is_available),
    is_featured: Boolean(row.is_featured),
    display_order: Number(row.display_order || 0),
    calories: row.calories == null ? null : Number(row.calories),
    tags: parseTagList(row.tags ? row.tags.split('||') : []),
  };
}

async function getMenuItems({ menu, search, tags, includeUnavailable = false } = {}, executor = db) {
  const requestedTags = parseTagList(tags);
  const conditions = [
    'c.is_active = TRUE',
    's.is_active = TRUE',
  ];
  const params = [];

  if (!includeUnavailable) {
    conditions.push('i.is_available = TRUE');
  }

  if (menu) {
    conditions.push('c.name = ?');
    params.push(menu);
  }

  if (search && String(search).trim()) {
    const like = `%${String(search).trim()}%`;
    conditions.push('(i.name LIKE ? OR COALESCE(i.description, \'\') LIKE ?)');
    params.push(like, like);
  }

  let havingClause = '';

  if (requestedTags.length > 0) {
    havingClause = `
      HAVING COUNT(DISTINCT CASE
        WHEN t.name IN (${requestedTags.map(() => '?').join(', ')})
        THEN t.name
      END) = ?
    `;

    params.push(...requestedTags, requestedTags.length);
  }

  const [rows] = await executor.query(`
    SELECT
      i.item_id,
      i.section_id,
      i.name,
      i.description,
      i.price,
      i.image_url,
      i.is_available,
      i.is_featured,
      i.display_order,
      i.calories,
      s.name AS section_name,
      s.category_id,
      c.name AS menu_name,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR '||') AS tags
    FROM menu_items i
    JOIN menu_sections s ON s.section_id = i.section_id
    JOIN menu_categories c ON c.category_id = s.category_id
    LEFT JOIN item_tags it ON it.item_id = i.item_id
    LEFT JOIN tags t ON t.tag_id = it.tag_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY
      i.item_id,
      i.section_id,
      i.name,
      i.description,
      i.price,
      i.image_url,
      i.is_available,
      i.is_featured,
      i.display_order,
      i.calories,
      s.name,
      s.category_id,
      c.name
    ${havingClause}
    ORDER BY c.display_order, s.display_order, i.display_order, i.name
  `, params);

  return rows.map(formatMenuItem);
}

async function getMenuSections(executor = db) {
  const [rows] = await executor.query(`
    SELECT
      s.section_id,
      s.name AS section_name,
      c.category_id,
      c.name AS menu_name
    FROM menu_sections s
    JOIN menu_categories c ON c.category_id = s.category_id
    WHERE s.is_active = TRUE AND c.is_active = TRUE
    ORDER BY c.display_order, s.display_order, s.name
  `);

  return rows.map((row) => ({
    section_id: row.section_id,
    section_name: row.section_name,
    category_id: row.category_id,
    menu_name: row.menu_name,
  }));
}

async function getAvailableTags(executor = db) {
  const [rows] = await executor.query(
    'SELECT tag_id, name FROM tags ORDER BY name'
  );

  return rows.map((row) => ({
    tag_id: row.tag_id,
    name: row.name,
  }));
}

async function getMenuItemById(itemId, executor = db) {
  const items = await getMenuItems({ includeUnavailable: true }, executor);
  return items.find((item) => item.id === Number(itemId)) || null;
}

function validateMenuItemPayload(payload = {}, { partial = false } = {}) {
  const errors = [];
  const name = String(payload.name || '').trim();
  const description = payload.description == null ? '' : String(payload.description).trim();
  const sectionId = Number(payload.sectionId ?? payload.section_id);
  const price = Number(payload.price);
  const imageUrl = payload.imageUrl == null ? '' : String(payload.imageUrl).trim();
  const displayOrder = payload.displayOrder == null || payload.displayOrder === ''
    ? 0
    : Number(payload.displayOrder);
  const calories = payload.calories == null || payload.calories === ''
    ? null
    : Number(payload.calories);
  const tags = parseTagList(payload.tags);

  if (!partial || payload.sectionId != null || payload.section_id != null) {
    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      errors.push('Select a valid menu section.');
    }
  }

  if (!partial || payload.name != null) {
    if (!name) {
      errors.push('Item name is required.');
    } else if (name.length > 150) {
      errors.push('Item name must be 150 characters or fewer.');
    }
  }

  if (!partial || payload.price != null) {
    if (!Number.isFinite(price) || price < 0) {
      errors.push('Price must be a valid non-negative number.');
    }
  }

  if (imageUrl.length > 255) {
    errors.push('Image URL must be 255 characters or fewer.');
  }

  if (!Number.isFinite(displayOrder) || displayOrder < 0) {
    errors.push('Display order must be a valid non-negative number.');
  }

  if (calories != null && (!Number.isFinite(calories) || calories < 0)) {
    errors.push('Calories must be a valid non-negative number when provided.');
  }

  return {
    errors,
    data: {
      sectionId,
      name,
      description,
      price,
      imageUrl,
      isAvailable: parseBoolean(payload.isAvailable ?? payload.is_available, true),
      isFeatured: parseBoolean(payload.isFeatured ?? payload.is_featured, false),
      displayOrder,
      calories,
      tags,
    },
  };
}

async function ensureSectionExists(sectionId, executor = db) {
  const [rows] = await executor.query(
    'SELECT section_id FROM menu_sections WHERE section_id = ? AND is_active = TRUE',
    [sectionId]
  );

  return rows.length > 0;
}

async function getTagIdsByName(tagNames, executor = db) {
  if (!tagNames.length) {
    return [];
  }

  const [rows] = await executor.query(
    `SELECT tag_id, name FROM tags WHERE name IN (${tagNames.map(() => '?').join(', ')})`,
    tagNames
  );

  return rows;
}

async function syncItemTags(itemId, tagNames, executor = db) {
  await executor.query('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

  if (!tagNames.length) {
    return;
  }

  const tags = await getTagIdsByName(tagNames, executor);
  const foundNames = tags.map((tag) => tag.name);
  const missingTags = tagNames.filter((tag) => !foundNames.includes(tag));

  if (missingTags.length) {
    const error = new Error(`Unknown tags: ${missingTags.join(', ')}`);
    error.status = 400;
    throw error;
  }

  await executor.query(
    `INSERT INTO item_tags (item_id, tag_id)
     VALUES ${tags.map(() => '(?, ?)').join(', ')}`,
    tags.flatMap((tag) => [itemId, tag.tag_id])
  );
}

module.exports = {
  getAvailableTags,
  getMenuItemById,
  getMenuItems,
  getMenuSections,
  parseTagList,
  syncItemTags,
  validateMenuItemPayload,
  ensureSectionExists,
};
