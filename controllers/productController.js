const db = require('../config/db');

// Helpers for JSON fields
const parseJSON = (str, fallback = null) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

const stringifyField = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch (e) {
    return null;
  }
};

const formatProduct = (prod) => {
  if (!prod) return prod;
  return {
    ...prod,
    faqs: parseJSON(prod.faqs, []),
    packages: parseJSON(prod.packages, [])
  };
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json(products.map(formatProduct));
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching products.' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(formatProduct(products[0]));
  } catch (error) {
    console.error('Fetch product by id error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching product details.' });
  }
};

// Create product (Admin)
exports.createProduct = async (req, res) => {
  // console.log('CREATE PRODUCT REQUEST BODY:', req.body);
  const {
    name, description, price, image_url, stock, category_id,
    tags, additional_info, faqs, packages, device_options, activation_options,
    discount_percent, is_hot, is_highlighted
  } = req.body;

  if (!name || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Name, description, price, and stock are required fields.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products (
        name, description, price, image_url, stock, category_id, 
        tags, additional_info, faqs, packages, device_options, activation_options,
        discount_percent, is_hot, is_highlighted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, parseFloat(price), image_url || '', parseInt(stock), category_id || null,
        tags || null, additional_info || null, stringifyField(faqs), stringifyField(packages),
        device_options || null, activation_options || null,
        discount_percent === undefined || discount_percent === '' || discount_percent === null ? null : parseInt(discount_percent),
        is_hot ? 1 : 0,
        is_highlighted ? 1 : 0
      ]
    );

    res.status(201).json({
      message: 'Product created successfully!',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Database error occurred while creating product.' });
  }
};

// Update product (Admin)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  // console.log('UPDATE PRODUCT REQUEST BODY:', req.body);
  const {
    name, description, price, image_url, stock, category_id,
    tags, additional_info, faqs, packages, device_options, activation_options,
    discount_percent, is_hot, is_highlighted
  } = req.body;

  if (!name || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Name, description, price, and stock are required fields.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE products SET 
        name = ?, description = ?, price = ?, image_url = ?, stock = ?, category_id = ?, 
        tags = ?, additional_info = ?, faqs = ?, packages = ?, device_options = ?, activation_options = ?,
        discount_percent = ?, is_hot = ?, is_highlighted = ?
      WHERE id = ?`,
      [
        name, description, parseFloat(price), image_url || '', parseInt(stock), category_id || null,
        tags || null, additional_info || null, stringifyField(faqs), stringifyField(packages),
        device_options || null, activation_options || null,
        discount_percent === undefined || discount_percent === '' || discount_percent === null ? null : parseInt(discount_percent),
        is_hot ? 1 : 0,
        is_highlighted ? 1 : 0,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found to update.' });
    }

    res.json({ message: 'Product updated successfully!' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Database error occurred while updating product.' });
  }
};

// Delete product (Admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found to delete.' });
    }

    res.json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Delete product error:', error);
    // If the product is linked in order items, we might get a foreign key constraint error.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message: 'Cannot delete product because it has associated customer orders. Set its stock to 0 instead.'
      });
    }
    res.status(500).json({ message: 'Database error occurred while deleting product.' });
  }
};

// Add or update a product review
exports.addOrUpdateReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, text } = req.body;
  const userId = req.user.id;

  if (rating === undefined || !text || text.trim() === '') {
    return res.status(400).json({ message: 'Rating and review text are required.' });
  }

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    // 1. Verify if the user has purchased this product AND the order is 'Delivered'
    const [purchased] = await db.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'Delivered'
       LIMIT 1`,
      [userId, productId]
    );

    if (purchased.length === 0) {
      return res.status(403).json({
        message: 'You can only review products that you have purchased and that have been successfully delivered.'
      });
    }

    // 2. Insert or update the review
    await db.query(
      `INSERT INTO reviews (user_id, product_id, rating, text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), text = VALUES(text), updated_at = CURRENT_TIMESTAMP`,
      [userId, productId, ratingVal, text.trim()]
    );

    res.json({ message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Database error occurred while submitting review.' });
  }
};

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  const { productId } = req.params;
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name AS user_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Fetch product reviews error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching reviews.' });
  }
};

// Get current user's review for a product (to allow editing)
exports.getUserReviewForProduct = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  try {
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    if (reviews.length === 0) {
      return res.json(null);
    }
    res.json(reviews[0]);
  } catch (error) {
    console.error('Fetch user review error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching your review.' });
  }
};

// Get latest reviews globally (for homepage testimonials)
exports.getLatestReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name AS user_name, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC
       LIMIT 4`
    );
    res.json(reviews);
  } catch (error) {
    console.error('Fetch latest reviews error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching latest reviews.' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching categories.' });
  }
};

// Create category (Admin)
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    const trimmed = name.trim();
    const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [trimmed]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name already exists.' });
    }
    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [trimmed]);
    res.status(201).json({ message: 'Category created successfully!', categoryId: result.insertId });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Database error occurred while creating category.' });
  }
};

// Update category (Admin)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    const trimmed = name.trim();
    const [existing] = await db.query('SELECT id FROM categories WHERE name = ? AND id != ?', [trimmed, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name already exists.' });
    }
    const [result] = await db.query('UPDATE categories SET name = ? WHERE id = ?', [trimmed, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category updated successfully!' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Database error occurred while updating category.' });
  }
};

// Delete category (Admin)
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found to delete.' });
    }
    res.json({ message: 'Category deleted successfully!' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Database error occurred while deleting category.' });
  }
};
