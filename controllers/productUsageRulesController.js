const db = require('../config/db');

// Ensure table exists
let tableChecked = false;
async function ensureRulesTable() {
  if (tableChecked) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_usage_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'Standard Usage Rules',
        rules_text LONGTEXT NOT NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_pur_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if initial samples should be seeded
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM product_usage_rules');
    if (countRows[0].total === 0) {
      const [sampleProducts] = await db.query(
        'SELECT id, name FROM products WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id ASC LIMIT 5'
      );
      if (sampleProducts.length > 0) {
        for (const prod of sampleProducts) {
          const sampleText = `📌 ${prod.name} - Usage Rules & Guidelines:\n─────────────────────────────────────────────\n1. 🔐 Security & Access:\n   - Do NOT change the registered account credentials or recovery details.\n   - Single designated user login only.\n2. 💻 Device Policy:\n   - Only use on authorized devices.\n   - No unauthorized reselling or sharing.\n3. ⚠️ Warranty Policy:\n   - Full support & replacement warranty during the active subscription period.\n   - Tampering with security settings voids warranty immediately.\n─────────────────────────────────────────────\n📞 Official Support: Contact via website or WhatsApp for any assistance.`;
          await db.query(
            'INSERT INTO product_usage_rules (product_id, title, rules_text, is_active) VALUES (?, ?, ?, 1)',
            [prod.id, 'Standard Usage Rules & Terms', sampleText]
          );
        }
      }
    }
    tableChecked = true;
  } catch (err) {
    console.error('Error ensuring product_usage_rules table:', err);
  }
}

// 1. Get all product usage rules (with product details)
exports.getAllRules = async (req, res) => {
  await ensureRulesTable();
  try {
    const { product_id, search } = req.query;
    let query = `
      SELECT pur.*, 
             p.name AS product_name, 
             p.image_url AS product_image, 
             p.price AS product_price,
             c.name AS category_name
      FROM product_usage_rules pur
      JOIN products p ON pur.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const params = [];

    if (product_id && product_id !== 'all') {
      query += ` AND pur.product_id = ?`;
      params.push(parseInt(product_id, 10));
    }

    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR pur.title LIKE ? OR pur.rules_text LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY pur.id DESC`;

    const [rules] = await db.query(query, params);
    res.json(rules);
  } catch (error) {
    console.error('Fetch product usage rules error:', error);
    res.status(500).json({ message: 'Failed to fetch product usage rules.' });
  }
};

// 2. Get rule by ID
exports.getRuleById = async (req, res) => {
  await ensureRulesTable();
  try {
    const { id } = req.params;
    const [rules] = await db.query(
      `SELECT pur.*, p.name AS product_name, p.image_url AS product_image, c.name AS category_name
       FROM product_usage_rules pur
       JOIN products p ON pur.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE pur.id = ?`,
      [id]
    );

    if (rules.length === 0) {
      return res.status(404).json({ message: 'Usage rule record not found.' });
    }

    res.json(rules[0]);
  } catch (error) {
    console.error('Fetch rule error:', error);
    res.status(500).json({ message: 'Failed to fetch usage rule.' });
  }
};

// 3. Get rules for a specific product
exports.getRulesByProductId = async (req, res) => {
  await ensureRulesTable();
  try {
    const { productId } = req.params;
    const [rules] = await db.query(
      `SELECT pur.*, p.name AS product_name
       FROM product_usage_rules pur
       JOIN products p ON pur.product_id = p.id
       WHERE pur.product_id = ? AND pur.is_active = 1
       ORDER BY pur.id DESC`,
      [productId]
    );
    res.json(rules);
  } catch (error) {
    console.error('Fetch rules by product error:', error);
    res.status(500).json({ message: 'Failed to fetch product rules.' });
  }
};

// 4. Create a new product usage rule
exports.createRule = async (req, res) => {
  await ensureRulesTable();
  try {
    const { product_id, title, rules_text, is_active } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'Please select a catalog product.' });
    }
    if (!rules_text || !rules_text.trim()) {
      return res.status(400).json({ message: 'Please enter rules content.' });
    }

    // Verify product exists
    const [prodCheck] = await db.query('SELECT id, name FROM products WHERE id = ?', [product_id]);
    if (prodCheck.length === 0) {
      return res.status(404).json({ message: 'Selected product was not found in catalog.' });
    }

    const [result] = await db.query(
      'INSERT INTO product_usage_rules (product_id, title, rules_text, is_active) VALUES (?, ?, ?, ?)',
      [
        parseInt(product_id, 10),
        title && title.trim() ? title.trim() : 'Standard Usage Rules',
        rules_text, // Keep exact formatting without trimming whitespace
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    res.status(201).json({
      message: 'Product usage rules saved successfully!',
      ruleId: result.insertId
    });
  } catch (error) {
    console.error('Create product usage rule error:', error);
    res.status(500).json({ message: 'Failed to save product usage rules.' });
  }
};

// 5. Update product usage rule
exports.updateRule = async (req, res) => {
  await ensureRulesTable();
  try {
    const { id } = req.params;
    const { product_id, title, rules_text, is_active } = req.body;

    if (!rules_text || !rules_text.trim()) {
      return res.status(400).json({ message: 'Rules text cannot be empty.' });
    }

    const [existing] = await db.query('SELECT id FROM product_usage_rules WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usage rule record not found.' });
    }

    const updateFields = [];
    const updateParams = [];

    if (product_id) {
      updateFields.push('product_id = ?');
      updateParams.push(parseInt(product_id, 10));
    }
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title.trim() || 'Standard Usage Rules');
    }
    if (rules_text !== undefined) {
      updateFields.push('rules_text = ?');
      updateParams.push(rules_text); // exact raw text preserved
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    updateParams.push(id);
    await db.query(`UPDATE product_usage_rules SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

    res.json({ message: 'Product usage rules updated successfully!' });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ message: 'Failed to update product usage rules.' });
  }
};

// 6. Delete product usage rule
exports.deleteRule = async (req, res) => {
  await ensureRulesTable();
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM product_usage_rules WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usage rule record not found.' });
    }
    res.json({ message: 'Product usage rule deleted successfully!' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ message: 'Failed to delete product usage rule.' });
  }
};
