const db = require('../config/db');

// Get all vendors with optional search, status filtering, and pagination/stats
exports.getAllVendors = async (req, res) => {
  try {
    const { search, status, category } = req.query;

    let query = `
      SELECT v.*
      FROM vendors v
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND v.status = ?`;
      params.push(status);
    }

    if (category && category !== 'all') {
      query += ` AND v.category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (v.name LIKE ? OR v.company_name LIKE ? OR v.phone LIKE ? OR v.whatsapp LIKE ? OR v.telegram LIKE ? OR v.email LIKE ? OR v.notes LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY v.id DESC`;

    let vendors = [];
    try {
      const [rows] = await db.query(query, params);
      vendors = rows;
    } catch (tblErr) {
      // If table doesn't exist yet, return empty list gracefully
      if (tblErr.code === 'ER_NO_SUCH_TABLE') {
        return res.json([]);
      }
      throw tblErr;
    }

    res.json(vendors);
  } catch (error) {
    console.error('Fetch vendors error:', error);
    res.status(500).json({ message: 'Error occurred while fetching vendors from database.' });
  }
};

// Get single vendor by ID
exports.getVendorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [vendors] = await db.query('SELECT * FROM vendors WHERE id = ?', [id]);
    if (vendors.length === 0) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    const vendor = vendors[0];
    vendor.products = [];

    res.json(vendor);
  } catch (error) {
    console.error('Fetch vendor details error:', error);
    res.status(500).json({ message: 'Error occurred while fetching vendor details.' });
  }
};

// Create a new vendor
exports.createVendor = async (req, res) => {
  const {
    name,
    company_name,
    phone,
    whatsapp,
    telegram,
    email,
    address,
    payment_details,
    category,
    status = 'Active',
    balance = 0.00,
    notes
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Vendor name is required.' });
  }

  try {
    const cleanWhatsapp = whatsapp ? whatsapp.replace(/[^0-9]/g, '') : (phone ? phone.replace(/[^0-9]/g, '') : null);

    const [result] = await db.query(
      `INSERT INTO vendors (
        name, company_name, phone, whatsapp, telegram, email, address,
        payment_details, category, status, balance, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        company_name ? company_name.trim() : null,
        phone ? phone.trim() : null,
        cleanWhatsapp,
        telegram ? telegram.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        payment_details ? payment_details.trim() : null,
        category ? category.trim() : 'General',
        status === 'Inactive' ? 'Inactive' : 'Active',
        parseFloat(balance) || 0.00,
        notes ? notes.trim() : null
      ]
    );

    res.status(201).json({
      message: 'Vendor created successfully!',
      vendorId: result.insertId
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Database error occurred while adding vendor.' });
  }
};

// Update an existing vendor
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    company_name,
    phone,
    whatsapp,
    telegram,
    email,
    address,
    payment_details,
    category,
    status,
    balance,
    notes
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Vendor name is required.' });
  }

  try {
    const cleanWhatsapp = whatsapp ? whatsapp.replace(/[^0-9]/g, '') : (phone ? phone.replace(/[^0-9]/g, '') : null);

    const [result] = await db.query(
      `UPDATE vendors SET
        name = ?,
        company_name = ?,
        phone = ?,
        whatsapp = ?,
        telegram = ?,
        email = ?,
        address = ?,
        payment_details = ?,
        category = ?,
        status = ?,
        balance = ?,
        notes = ?
      WHERE id = ?`,
      [
        name.trim(),
        company_name ? company_name.trim() : null,
        phone ? phone.trim() : null,
        cleanWhatsapp,
        telegram ? telegram.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        payment_details ? payment_details.trim() : null,
        category ? category.trim() : 'General',
        status === 'Inactive' ? 'Inactive' : 'Active',
        parseFloat(balance) || 0.00,
        notes ? notes.trim() : null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vendor not found or no changes made.' });
    }

    res.json({ message: 'Vendor updated successfully!' });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Database error occurred while updating vendor.' });
  }
};

exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM vendors WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    res.json({ message: 'Vendor removed successfully!' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Database error occurred while deleting vendor.' });
  }
};

// Vendor stats summary
exports.getVendorStats = async (req, res) => {
  try {
    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM vendors');
    const [activeRows] = await db.query("SELECT COUNT(*) as active FROM vendors WHERE status = 'Active'");
    const [inactiveRows] = await db.query("SELECT COUNT(*) as inactive FROM vendors WHERE status = 'Inactive'");
    const [categoriesRows] = await db.query('SELECT DISTINCT category FROM vendors WHERE category IS NOT NULL AND category != ""');

    res.json({
      total: totalRows[0]?.total || 0,
      active: activeRows[0]?.active || 0,
      inactive: inactiveRows[0]?.inactive || 0,
      categoriesCount: categoriesRows.length || 0
    });
  } catch (error) {
    console.error('Vendor stats error:', error);
    res.status(500).json({ message: 'Failed to fetch vendor statistics.' });
  }
};
