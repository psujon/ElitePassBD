const db = require('../config/db');

// Get all license keys
exports.getAllLicenses = async (req, res) => {
  try {
    const [licenses] = await db.query(`
      SELECT pl.*, p.name AS product_name 
      FROM product_licenses pl
      JOIN products p ON pl.product_id = p.id
      ORDER BY pl.id DESC
    `);
    res.json(licenses);
  } catch (error) {
    console.error('Fetch licenses error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching licenses.' });
  }
};

// Create license key(s) - supports single or bulk (newline-separated) insertion
exports.createLicense = async (req, res) => {
  const { product_id, activation_option, package_option, license_key } = req.body;

  if (!product_id || !license_key) {
    return res.status(400).json({ message: 'Product ID and License Key are required fields.' });
  }

  try {
    // Verify product exists
    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Selected product not found.' });
    }

    // Split keys by newline and filter out empty strings
    const keys = license_key
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      return res.status(400).json({ message: 'No valid license keys provided.' });
    }

    // Prepare values for bulk insert
    const values = keys.map(k => [
      parseInt(product_id),
      activation_option ? activation_option.trim() : null,
      package_option ? package_option.trim() : null,
      k,
      0 // is_used = 0
    ]);

    await db.query(
      `INSERT INTO product_licenses (product_id, activation_option, package_option, license_key, is_used) VALUES ?`,
      [values]
    );

    res.status(201).json({
      message: `Successfully saved ${keys.length} license key(s)!`
    });
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({ message: 'Database error occurred while saving license keys.' });
  }
};

// Delete license key
exports.deleteLicense = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM product_licenses WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'License key not found.' });
    }

    res.json({ message: 'License key deleted successfully!' });
  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ message: 'Database error occurred while deleting license key.' });
  }
};

// Update license key
exports.updateLicense = async (req, res) => {
  const { id } = req.params;
  const { product_id, activation_option, package_option, license_key } = req.body;

  if (!product_id || !license_key) {
    return res.status(400).json({ message: 'Product and License Key are required.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE product_licenses 
       SET product_id = ?, activation_option = ?, package_option = ?, license_key = ? 
       WHERE id = ?`,
      [
        parseInt(product_id),
        activation_option ? activation_option.trim() : null,
        package_option ? package_option.trim() : null,
        license_key.trim(),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'License key not found.' });
    }

    res.json({ message: 'License key updated successfully!' });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ message: 'Database error occurred while updating license key.' });
  }
};
