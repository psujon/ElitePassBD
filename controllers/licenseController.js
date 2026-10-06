const db = require('../config/db');

exports.getAllLicenses = async (req, res) => {
  try {
    const [licenses] = await db.query(`
      SELECT pl.*, p.name AS product_name, COALESCE(pl.used_at, o.created_at) AS used_at
      FROM product_licenses pl
      JOIN products p ON pl.product_id = p.id
      LEFT JOIN order_items oi ON pl.order_item_id = oi.id
      LEFT JOIN orders o ON oi.order_id = o.id
      ORDER BY pl.id DESC
    `);
    res.json(licenses);
  } catch (error) {
    console.error('Fetch licenses error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching licenses.' });
  }
};

exports.getAvailableLicenses = async (req, res) => {
  const { product_id, product_name, package_name, filter_by_package } = req.query;
  try {
    let targetProductId = product_id ? parseInt(product_id) : null;
    if (!targetProductId && product_name) {
      const trimmedProd = product_name.trim();
      const [prods] = await db.query(
        'SELECT id FROM products WHERE (name = ? OR name LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY (name = ?) DESC LIMIT 1',
        [trimmedProd, `%${trimmedProd}%`, trimmedProd]
      );
      if (prods.length > 0) {
        targetProductId = prods[0].id;
      }
    }

    if (!targetProductId) {
      return res.json({ count: 0, licenses: [] });
    }

    let query = `
      SELECT pl.id, pl.product_id, pl.activation_option, pl.package_option, pl.rules, pl.license_key, pl.created_at, p.name as product_name
      FROM product_licenses pl
      JOIN products p ON pl.product_id = p.id
      WHERE pl.product_id = ? AND pl.is_used = 0
    `;
    const params = [targetProductId];

    if (filter_by_package === 'true' && package_name && package_name.trim()) {
      const fullPkg = package_name.trim();
      let durationPart = fullPkg;
      let activationPart = null;
      if (fullPkg.includes(' - ')) {
        const parts = fullPkg.split(' - ');
        durationPart = parts[0].trim();
        activationPart = parts.slice(1).join(' - ').trim();
      }

      query += `
        AND (
          TRIM(pl.package_option) = ?
          OR (
            (TRIM(pl.package_option) = ? OR pl.package_option IS NULL)
            AND (? IS NULL OR TRIM(pl.activation_option) = ? OR pl.activation_option IS NULL)
          )
        )
        ORDER BY pl.id ASC
      `;
      params.push(fullPkg, durationPart, activationPart, activationPart);
    } else if (package_name && package_name.trim()) {
      query += `
        ORDER BY 
          (pl.package_option <=> ?) DESC,
          (pl.package_option IS NULL) DESC,
          pl.id ASC
      `;
      params.push(package_name.trim());
    } else {
      query += ` ORDER BY pl.id ASC`;
    }

    const [rows] = await db.query(query, params);
    res.json({
      count: rows.length,
      licenses: rows
    });
  } catch (error) {
    console.error('Fetch available licenses error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching available licenses.' });
  }
};

exports.createLicense = async (req, res) => {
  const { product_id, activation_option, package_option, rules, license_key } = req.body;

  if (!product_id || !license_key) {
    return res.status(400).json({ message: 'Product ID and License Key are required fields.' });
  }

  try {
    const [product] = await db.query('SELECT id FROM products WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Selected product not found or is no longer available.' });
    }

    const keys = license_key
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      return res.status(400).json({ message: 'No valid license keys provided.' });
    }

    const values = keys.map(k => [
      parseInt(product_id),
      activation_option ? activation_option.trim() : null,
      package_option ? package_option.trim() : null,
      rules ? rules.trim() : null,
      k,
      0 // is_used = 0
    ]);

    await db.query(
      `INSERT INTO product_licenses (product_id, activation_option, package_option, rules, license_key, is_used) VALUES ?`,
      [values]
    );

    res.status(201).json({
      message: `Successfully saved ${keys.length} license key(s)!`
    });
  } catch (error) {
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.errno === 1366) {
      try {
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN rules LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN license_key LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN activation_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN package_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");

        await db.query(
          `INSERT INTO product_licenses (product_id, activation_option, package_option, rules, license_key, is_used) VALUES ?`,
          [values]
        );

        return res.status(201).json({
          message: `Successfully saved ${keys.length} license key(s)!`
        });
      } catch (retryErr) {
        console.error('Auto-repair utf8mb4 on createLicense retry failed:', retryErr);
      }
    }
    console.error('Create license error:', error);
    res.status(500).json({ message: error.message || 'Database error occurred while saving license keys.' });
  }
};

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

exports.updateLicense = async (req, res) => {
  const { id } = req.params;
  const { product_id, activation_option, package_option, rules, license_key } = req.body;

  if (!product_id || !license_key) {
    return res.status(400).json({ message: 'Product and License Key are required.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE product_licenses 
       SET product_id = ?, activation_option = ?, package_option = ?, rules = ?, license_key = ? 
       WHERE id = ?`,
      [
        parseInt(product_id),
        activation_option ? activation_option.trim() : null,
        package_option ? package_option.trim() : null,
        rules ? rules.trim() : null,
        license_key.trim(),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'License key not found.' });
    }

    res.json({ message: 'License key updated successfully!' });
  } catch (error) {
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || error.errno === 1366) {
      try {
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN rules LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN license_key LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN activation_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");
        await db.query("ALTER TABLE product_licenses MODIFY COLUMN package_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL");

        const [retryResult] = await db.query(
          `UPDATE product_licenses 
           SET product_id = ?, activation_option = ?, package_option = ?, rules = ?, license_key = ? 
           WHERE id = ?`,
          [
            parseInt(product_id),
            activation_option ? activation_option.trim() : null,
            package_option ? package_option.trim() : null,
            rules ? rules.trim() : null,
            license_key.trim(),
            id
          ]
        );

        if (retryResult.affectedRows === 0) {
          return res.status(404).json({ message: 'License key not found.' });
        }

        return res.json({ message: 'License key updated successfully!' });
      } catch (retryErr) {
        console.error('Auto-repair utf8mb4 on updateLicense retry failed:', retryErr);
      }
    }
    console.error('Update license error:', error);
    res.status(500).json({ message: error.message || 'Database error occurred while updating license key.' });
  }
};
