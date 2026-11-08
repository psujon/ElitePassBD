const db = require('../config/db');

// Ensure table exists defensively
let tableChecked = false;
async function ensurePageSectionsTable() {
  if (tableChecked) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS page_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_key VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ps_page_key (page_key),
        INDEX idx_ps_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableChecked = true;
  } catch (err) {
    console.error('Error ensuring page_sections table:', err);
  }
}

// 1. Public: Get active sections for a specific page by page_key
exports.getSectionsByPageKey = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { pageKey } = req.params;
    if (!pageKey) {
      return res.status(400).json({ success: false, message: 'Page key is required.' });
    }

    const [sections] = await db.query(
      `SELECT id, page_key, title, content, sort_order, is_active, created_at, updated_at
       FROM page_sections
       WHERE page_key = ? AND is_active = 1
       ORDER BY sort_order ASC, id ASC`,
      [pageKey.toLowerCase().trim()]
    );

    return res.json({ success: true, sections });
  } catch (error) {
    console.error('Error fetching public page sections:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch page sections.' });
  }
};

// 2. Admin: Get all sections (or filtered by page_key)
exports.getAllAdminSections = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { page_key } = req.query;
    let query = 'SELECT * FROM page_sections';
    const params = [];

    if (page_key && page_key.trim() !== '') {
      query += ' WHERE page_key = ?';
      params.push(page_key.toLowerCase().trim());
    }

    query += ' ORDER BY page_key ASC, sort_order ASC, id ASC';

    const [sections] = await db.query(query, params);
    return res.json({ success: true, sections });
  } catch (error) {
    console.error('Error fetching admin page sections:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin page sections.' });
  }
};

// 3. Admin: Create a new page section
exports.createSection = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { page_key, title, content, sort_order, is_active } = req.body;

    if (!page_key || !title || !content) {
      return res.status(400).json({ success: false, message: 'Page key, title, and content are required.' });
    }

    const cleanPageKey = page_key.toLowerCase().trim();

    let finalSortOrder = sort_order !== undefined && sort_order !== null && !isNaN(parseInt(sort_order, 10))
      ? parseInt(sort_order, 10)
      : null;

    if (finalSortOrder === null) {
      const [maxRows] = await db.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM page_sections WHERE page_key = ?',
        [cleanPageKey]
      );
      finalSortOrder = (maxRows[0]?.max_sort || 0) + 1;
    }

    const activeStatus = is_active === undefined ? 1 : (is_active ? 1 : 0);

    const [result] = await db.query(
      `INSERT INTO page_sections (page_key, title, content, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanPageKey, title.trim(), content, finalSortOrder, activeStatus]
    );

    const [newRecord] = await db.query('SELECT * FROM page_sections WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Page section created successfully.',
      section: newRecord[0]
    });
  } catch (error) {
    console.error('Error creating page section:', error);
    return res.status(500).json({ success: false, message: 'Failed to create page section.' });
  }
};

// 4. Admin: Update an existing page section
exports.updateSection = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { id } = req.params;
    const { page_key, title, content, sort_order, is_active } = req.body;

    const [existing] = await db.query('SELECT * FROM page_sections WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Page section not found.' });
    }

    const cleanPageKey = page_key ? page_key.toLowerCase().trim() : existing[0].page_key;
    const cleanTitle = title !== undefined ? title.trim() : existing[0].title;
    const cleanContent = content !== undefined ? content : existing[0].content;
    const finalSortOrder = sort_order !== undefined && !isNaN(parseInt(sort_order, 10))
      ? parseInt(sort_order, 10)
      : existing[0].sort_order;
    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active;

    await db.query(
      `UPDATE page_sections
       SET page_key = ?, title = ?, content = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [cleanPageKey, cleanTitle, cleanContent, finalSortOrder, activeStatus, id]
    );

    const [updatedRecord] = await db.query('SELECT * FROM page_sections WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Page section updated successfully.',
      section: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating page section:', error);
    return res.status(500).json({ success: false, message: 'Failed to update page section.' });
  }
};

// 5. Admin: Delete a page section
exports.deleteSection = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM page_sections WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Page section not found.' });
    }

    await db.query('DELETE FROM page_sections WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Page section deleted successfully.' });
  } catch (error) {
    console.error('Error deleting page section:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete page section.' });
  }
};

// 6. Admin: Reorder sections in batch
exports.reorderSections = async (req, res) => {
  await ensurePageSectionsTable();
  try {
    const { items } = req.body; // Expects: [ { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 } ]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required.' });
    }

    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await db.query('UPDATE page_sections SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
    }

    return res.json({ success: true, message: 'Sections reordered successfully.' });
  } catch (error) {
    console.error('Error reordering page sections:', error);
    return res.status(500).json({ success: false, message: 'Failed to reorder page sections.' });
  }
};

