const db = require('../config/db');

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS digital_license_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT DEFAULT NULL,
        product_name VARCHAR(255) NOT NULL,
        account_email VARCHAR(255) NOT NULL,
        account_password VARCHAR(255) NOT NULL,
        recovery_email VARCHAR(255) DEFAULT NULL,
        two_factor_status ENUM('Enabled', 'Disabled') DEFAULT 'Enabled',
        two_factor_key TEXT DEFAULT NULL,
        total_slots INT NOT NULL DEFAULT 5,
        status ENUM('Active', 'Expiring', 'Expired', 'Inactive') DEFAULT 'Active',
        expiry_date DATE DEFAULT NULL,
        vendor_id INT DEFAULT NULL,
        vendor_name VARCHAR(255) DEFAULT NULL,
        purchased_date DATE DEFAULT NULL,
        renewal_date DATE DEFAULT NULL,
        purchase_price DECIMAL(10, 2) DEFAULT 0.00,
        renewal_cost DECIMAL(10, 2) DEFAULT 0.00,
        payment_method VARCHAR(50) DEFAULT 'bKash',
        invoice_no VARCHAR(100) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dla_product (product_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS digital_license_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        slot_number INT NOT NULL,
        order_id INT DEFAULT NULL,
        assigned_to VARCHAR(255) DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT NULL,
        customer_phone VARCHAR(50) DEFAULT NULL,
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        status ENUM('Active', 'Available', 'Expired', 'Suspended') DEFAULT 'Available',
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES digital_license_accounts(id) ON DELETE CASCADE,
        INDEX idx_dls_account_slot (account_id, slot_number),
        INDEX idx_dls_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await db.query(`ALTER TABLE digital_license_slots ADD COLUMN order_id INT DEFAULT NULL AFTER slot_number`);
    } catch (e) {
      // Column already exists
    }

    // Check if initial sample data should be seeded
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM digital_license_accounts');
    if (countRows[0].total === 0) {
      await seedInitialAccounts();
    }

    tablesEnsured = true;
  } catch (err) {
    console.error('Error ensuring digital license tables:', err);
  }
}

async function seedInitialAccounts() {
  try {
    const sampleAccounts = [
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office01@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery@email.com',
        two_factor_status: 'Enabled',
        two_factor_key: 'JBSWY3DPEHPK3PXP',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2026-12-20',
        vendor_name: 'ABC Digital Store',
        purchased_date: '2025-12-20',
        renewal_date: '2026-12-20',
        purchase_price: 4500.00,
        renewal_cost: 4500.00,
        payment_method: 'bKash',
        invoice_no: 'INV-00256',
        slots: [
          { slot_number: 1, assigned_to: 'user1@email.com', customer_name: 'Customer A', customer_phone: '01812345671', start_date: '2026-01-01', end_date: '2027-01-01', status: 'Active' },
          { slot_number: 2, assigned_to: 'user2@email.com', customer_name: 'Customer B', customer_phone: '01812345672', start_date: '2026-02-15', end_date: '2027-02-15', status: 'Active' },
          { slot_number: 3, assigned_to: 'user3@email.com', customer_name: 'Customer C', customer_phone: '01812345673', start_date: '2026-03-10', end_date: '2027-03-10', status: 'Active' },
          { slot_number: 4, assigned_to: 'user4@email.com', customer_name: 'Customer D', customer_phone: '01812345674', start_date: '2026-04-20', end_date: '2027-04-20', status: 'Active' },
          { slot_number: 5, assigned_to: null, customer_name: null, customer_phone: null, start_date: null, end_date: null, status: 'Available' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office02@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery02@email.com',
        two_factor_status: 'Enabled',
        two_factor_key: 'HXDMVJECJJW983KD',
        total_slots: 5,
        status: 'Expiring',
        expiry_date: '2026-10-10',
        vendor_name: 'Vendor B',
        purchased_date: '2025-10-10',
        renewal_date: '2026-10-10',
        purchase_price: 4300.00,
        renewal_cost: 4300.00,
        payment_method: 'Nagad',
        invoice_no: 'INV-00189',
        slots: [
          { slot_number: 1, assigned_to: 'tanvir@gmail.com', customer_name: 'Tanvir Ahmed', start_date: '2025-10-10', end_date: '2026-10-10', status: 'Active' },
          { slot_number: 2, assigned_to: 'sakib@outlook.com', customer_name: 'Sakib Hasan', start_date: '2025-10-10', end_date: '2026-10-10', status: 'Active' },
          { slot_number: 3, assigned_to: 'rahim@gmail.com', customer_name: 'Abdur Rahim', start_date: '2025-10-10', end_date: '2026-10-10', status: 'Active' },
          { slot_number: 4, assigned_to: 'monir@yahoo.com', customer_name: 'Monir Hossain', start_date: '2025-10-10', end_date: '2026-10-10', status: 'Active' },
          { slot_number: 5, assigned_to: 'fatima@gmail.com', customer_name: 'Fatima Zohra', start_date: '2025-10-10', end_date: '2026-10-10', status: 'Active' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office03@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery03@email.com',
        two_factor_status: 'Enabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-03-15',
        vendor_name: 'Vendor A',
        purchased_date: '2026-03-15',
        renewal_date: '2027-03-15',
        purchase_price: 4500.00,
        renewal_cost: 4500.00,
        payment_method: 'bKash',
        invoice_no: 'INV-00301',
        slots: [
          { slot_number: 1, assigned_to: 'karim@gmail.com', customer_name: 'Karim Ullah', start_date: '2026-03-15', end_date: '2027-03-15', status: 'Active' },
          { slot_number: 2, assigned_to: 'farhan@gmail.com', customer_name: 'Farhan Kabir', start_date: '2026-03-15', end_date: '2027-03-15', status: 'Active' },
          { slot_number: 3, status: 'Available' },
          { slot_number: 4, status: 'Available' },
          { slot_number: 5, status: 'Available' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office04@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery04@email.com',
        two_factor_status: 'Disabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-01-01',
        vendor_name: 'Vendor C',
        purchased_date: '2026-01-01',
        renewal_date: '2027-01-01',
        purchase_price: 4400.00,
        renewal_cost: 4400.00,
        payment_method: 'Bank Transfer',
        invoice_no: 'INV-00277',
        slots: [
          { slot_number: 1, assigned_to: 'nasir@gmail.com', customer_name: 'Nasir Uddin', start_date: '2026-01-01', end_date: '2027-01-01', status: 'Active' },
          { slot_number: 2, assigned_to: 'shimu@gmail.com', customer_name: 'Shimu Akter', start_date: '2026-01-01', end_date: '2027-01-01', status: 'Active' },
          { slot_number: 3, assigned_to: 'arif@gmail.com', customer_name: 'Ariful Islam', start_date: '2026-01-01', end_date: '2027-01-01', status: 'Active' },
          { slot_number: 4, assigned_to: 'jamal@gmail.com', customer_name: 'Jamal Khan', start_date: '2026-01-01', end_date: '2027-01-01', status: 'Active' },
          { slot_number: 5, status: 'Available' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office05@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery05@email.com',
        two_factor_status: 'Enabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-02-17',
        vendor_name: 'Vendor A',
        purchased_date: '2026-02-17',
        renewal_date: '2027-02-17',
        purchase_price: 4500.00,
        renewal_cost: 4500.00,
        payment_method: 'bKash',
        invoice_no: 'INV-00290',
        slots: [
          { slot_number: 1, assigned_to: 'rubel@gmail.com', customer_name: 'Rubel Mia', start_date: '2026-02-17', end_date: '2027-02-17', status: 'Active' },
          { slot_number: 2, assigned_to: 'sayeed@gmail.com', customer_name: 'Sayeed Anwar', start_date: '2026-02-17', end_date: '2027-02-17', status: 'Active' },
          { slot_number: 3, assigned_to: 'hafiz@gmail.com', customer_name: 'Hafizur Rahman', start_date: '2026-02-17', end_date: '2027-02-17', status: 'Active' },
          { slot_number: 4, status: 'Available' },
          { slot_number: 5, status: 'Available' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office06@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery06@email.com',
        two_factor_status: 'Enabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-04-05',
        vendor_name: 'Vendor B',
        purchased_date: '2026-04-05',
        renewal_date: '2027-04-05',
        purchase_price: 4500.00,
        renewal_cost: 4500.00,
        payment_method: 'Nagad',
        invoice_no: 'INV-00310',
        slots: [
          { slot_number: 1, assigned_to: 'tarek@gmail.com', customer_name: 'Tarek Mahmud', start_date: '2026-04-05', end_date: '2027-04-05', status: 'Active' },
          { slot_number: 2, assigned_to: 'munna@gmail.com', customer_name: 'Munna Chowdhury', start_date: '2026-04-05', end_date: '2027-04-05', status: 'Active' },
          { slot_number: 3, assigned_to: 'sohel@gmail.com', customer_name: 'Sohel Rana', start_date: '2026-04-05', end_date: '2027-04-05', status: 'Active' },
          { slot_number: 4, assigned_to: 'nabil@gmail.com', customer_name: 'Nabil Hasan', start_date: '2026-04-05', end_date: '2027-04-05', status: 'Active' },
          { slot_number: 5, assigned_to: 'joy@gmail.com', customer_name: 'Joyanta Roy', start_date: '2026-04-05', end_date: '2027-04-05', status: 'Active' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office07@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery07@email.com',
        two_factor_status: 'Enabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-05-12',
        vendor_name: 'Vendor C',
        purchased_date: '2026-05-12',
        renewal_date: '2027-05-12',
        purchase_price: 4400.00,
        renewal_cost: 4400.00,
        payment_method: 'Card',
        invoice_no: 'INV-00325',
        slots: [
          { slot_number: 1, assigned_to: 'kamrul@gmail.com', customer_name: 'Kamrul Hasan', start_date: '2026-05-12', end_date: '2027-05-12', status: 'Active' },
          { slot_number: 2, assigned_to: 'anika@gmail.com', customer_name: 'Anika Tabassum', start_date: '2026-05-12', end_date: '2027-05-12', status: 'Active' },
          { slot_number: 3, assigned_to: 'rabi@gmail.com', customer_name: 'Rabiul Awal', start_date: '2026-05-12', end_date: '2027-05-12', status: 'Active' },
          { slot_number: 4, assigned_to: 'faisal@gmail.com', customer_name: 'Faisal Ahmed', start_date: '2026-05-12', end_date: '2027-05-12', status: 'Active' },
          { slot_number: 5, status: 'Available' }
        ]
      },
      {
        product_name: 'Microsoft 365 Family',
        account_email: 'office08@email.com',
        account_password: 'Password@365!',
        recovery_email: 'recovery08@email.com',
        two_factor_status: 'Enabled',
        total_slots: 5,
        status: 'Active',
        expiry_date: '2027-06-30',
        vendor_name: 'Vendor A',
        purchased_date: '2026-06-30',
        renewal_date: '2027-06-30',
        purchase_price: 4500.00,
        renewal_cost: 4500.00,
        payment_method: 'bKash',
        invoice_no: 'INV-00340',
        slots: [
          { slot_number: 1, assigned_to: 'bijoy@gmail.com', customer_name: 'Bijoy Sen', start_date: '2026-06-30', end_date: '2027-06-30', status: 'Active' },
          { slot_number: 2, assigned_to: 'mithu@gmail.com', customer_name: 'Mithu Das', start_date: '2026-06-30', end_date: '2027-06-30', status: 'Active' },
          { slot_number: 3, assigned_to: 'sumon@gmail.com', customer_name: 'Sumon Sarkar', start_date: '2026-06-30', end_date: '2027-06-30', status: 'Active' },
          { slot_number: 4, assigned_to: 'pappu@gmail.com', customer_name: 'Pappu Mia', start_date: '2026-06-30', end_date: '2027-06-30', status: 'Active' },
          { slot_number: 5, status: 'Available' }
        ]
      },
      {
        product_name: 'Adobe Creative Cloud',
        account_email: 'designteam@company.com',
        account_password: 'AdobeCreative@2026',
        recovery_email: 'recovery-adobe@company.com',
        two_factor_status: 'Enabled',
        two_factor_key: 'ADOBE2FAKEY884',
        total_slots: 2,
        status: 'Expiring',
        expiry_date: '2026-10-25',
        vendor_name: 'Global Tech Suppliers',
        purchased_date: '2025-10-25',
        renewal_date: '2026-10-25',
        purchase_price: 18500.00,
        renewal_cost: 18500.00,
        payment_method: 'Bank Transfer',
        invoice_no: 'INV-AD-9912',
        slots: [
          { slot_number: 1, assigned_to: 'lead-designer@agency.com', customer_name: 'Agency Studio', start_date: '2025-10-25', end_date: '2026-10-25', status: 'Active' },
          { slot_number: 2, assigned_to: 'videoeditor@agency.com', customer_name: 'Motion VFX Team', start_date: '2025-10-25', end_date: '2026-10-25', status: 'Active' }
        ]
      },
      {
        product_name: 'Antivirus License AV-104',
        account_email: 'av-sec01@security.com',
        account_password: 'SecurityShield#2026',
        recovery_email: 'av-admin@security.com',
        two_factor_status: 'Disabled',
        total_slots: 1,
        status: 'Active',
        expiry_date: '2027-05-01',
        vendor_name: 'Cyber Security BD',
        purchased_date: '2026-05-01',
        renewal_date: '2027-05-01',
        purchase_price: 1200.00,
        renewal_cost: 1200.00,
        payment_method: 'bKash',
        invoice_no: 'INV-AV-4401',
        slots: [
          { slot_number: 1, assigned_to: 'client-server@enterprise.com', customer_name: 'Enterprise IT', start_date: '2026-05-01', end_date: '2027-05-01', status: 'Active' }
        ]
      }
    ];

    for (const acc of sampleAccounts) {
      const [res] = await db.query(
        `INSERT INTO digital_license_accounts (
          product_name, account_email, account_password, recovery_email,
          two_factor_status, two_factor_key, total_slots, status, expiry_date,
          vendor_name, purchased_date, renewal_date, purchase_price, renewal_cost,
          payment_method, invoice_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          acc.product_name, acc.account_email, acc.account_password, acc.recovery_email,
          acc.two_factor_status || 'Enabled', acc.two_factor_key || null, acc.total_slots, acc.status, acc.expiry_date,
          acc.vendor_name, acc.purchased_date, acc.renewal_date, acc.purchase_price, acc.renewal_cost,
          acc.payment_method, acc.invoice_no
        ]
      );

      const accountId = res.insertId;
      for (const slot of acc.slots) {
        await db.query(
          `INSERT INTO digital_license_slots (
            account_id, slot_number, assigned_to, customer_name, customer_phone,
            start_date, end_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            accountId, slot.slot_number, slot.assigned_to || null, slot.customer_name || null, slot.customer_phone || null,
            slot.start_date || null, slot.end_date || null, slot.status || 'Available'
          ]
        );
      }
    }
  } catch (err) {
    console.error('Error seeding initial accounts:', err);
  }
}

// 1. Get all digital license accounts with aggregated slot stats
exports.getAllAccounts = async (req, res) => {
  await ensureTables();
  try {
    const { product_name, status, search } = req.query;

    let query = `
      SELECT 
        dla.*,
        COUNT(dls.id) AS slot_count,
        SUM(CASE WHEN dls.status = 'Active' THEN 1 ELSE 0 END) AS used_slots,
        SUM(CASE WHEN dls.status = 'Available' OR dls.status IS NULL THEN 1 ELSE 0 END) AS available_slots
      FROM digital_license_accounts dla
      LEFT JOIN digital_license_slots dls ON dla.id = dls.account_id
      WHERE 1=1
    `;
    const params = [];

    if (product_name && product_name !== 'all') {
      query += ` AND dla.product_name = ?`;
      params.push(product_name.trim());
    }

    if (status && status !== 'all') {
      query += ` AND dla.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (
        dla.account_email LIKE ? OR 
        dla.product_name LIKE ? OR 
        dla.vendor_name LIKE ? OR 
        dla.invoice_no LIKE ?
      )`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY dla.id ORDER BY dla.id DESC`;

    const [accounts] = await db.query(query, params);

    // Fetch all slots for each account so UI has full details
    const accountIds = accounts.map(a => a.id);
    let allSlots = [];
    if (accountIds.length > 0) {
      const [slotRows] = await db.query(
        `SELECT * FROM digital_license_slots WHERE account_id IN (?) ORDER BY account_id, slot_number ASC`,
        [accountIds]
      );
      allSlots = slotRows;
    }

    // Attach slots to accounts
    const accountsWithSlots = accounts.map(acc => {
      const slots = allSlots.filter(s => s.account_id === acc.id);
      const used = slots.filter(s => s.status === 'Active').length;
      const left = Math.max(0, acc.total_slots - used);
      return {
        ...acc,
        used_slots: used,
        available_slots: left,
        slots: slots
      };
    });

    res.json(accountsWithSlots);
  } catch (error) {
    console.error('Fetch digital license accounts error:', error);
    res.status(500).json({ message: 'Failed to fetch accounts.' });
  }
};

// 2. Get single account with slots
exports.getAccountById = async (req, res) => {
  await ensureTables();
  try {
    const { id } = req.params;
    const [accounts] = await db.query('SELECT * FROM digital_license_accounts WHERE id = ?', [id]);
    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    const account = accounts[0];
    const [slots] = await db.query(
      'SELECT * FROM digital_license_slots WHERE account_id = ? ORDER BY slot_number ASC',
      [id]
    );

    const used = slots.filter(s => s.status === 'Active').length;
    const left = Math.max(0, account.total_slots - used);

    res.json({
      ...account,
      used_slots: used,
      available_slots: left,
      slots: slots
    });
  } catch (error) {
    console.error('Fetch account by id error:', error);
    res.status(500).json({ message: 'Failed to fetch account details.' });
  }
};

// 3. Create digital license account
exports.createAccount = async (req, res) => {
  await ensureTables();
  try {
    const {
      product_id,
      product_name,
      account_email,
      account_password,
      recovery_email,
      two_factor_status,
      two_factor_key,
      total_slots,
      status,
      expiry_date,
      vendor_id,
      vendor_name,
      purchased_date,
      renewal_date,
      purchase_price,
      renewal_cost,
      payment_method,
      invoice_no,
      notes
    } = req.body;

    if (!account_email || !product_name) {
      return res.status(400).json({ message: 'Product name and Account Email are required.' });
    }

    const numSlots = parseInt(total_slots, 10) || 5;

    const [result] = await db.query(
      `INSERT INTO digital_license_accounts (
        product_id, product_name, account_email, account_password, recovery_email,
        two_factor_status, two_factor_key, total_slots, status, expiry_date,
        vendor_id, vendor_name, purchased_date, renewal_date, purchase_price,
        renewal_cost, payment_method, invoice_no, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id ? parseInt(product_id, 10) : null,
        product_name.trim(),
        account_email.trim(),
        account_password ? account_password.trim() : '',
        recovery_email ? recovery_email.trim() : null,
        two_factor_status || 'Enabled',
        two_factor_key ? two_factor_key.trim() : null,
        numSlots,
        status || 'Active',
        expiry_date || null,
        vendor_id ? parseInt(vendor_id, 10) : null,
        vendor_name ? vendor_name.trim() : null,
        purchased_date || null,
        renewal_date || null,
        purchase_price ? parseFloat(purchase_price) : 0.00,
        renewal_cost ? parseFloat(renewal_cost) : 0.00,
        payment_method || 'bKash',
        invoice_no ? invoice_no.trim() : null,
        notes || null
      ]
    );

    const accountId = result.insertId;

    // Generate slots (1 to numSlots)
    for (let i = 1; i <= numSlots; i++) {
      await db.query(
        `INSERT INTO digital_license_slots (account_id, slot_number, status) VALUES (?, ?, 'Available')`,
        [accountId, i]
      );
    }

    res.status(201).json({
      message: 'Digital license account created successfully!',
      accountId: accountId
    });
  } catch (error) {
    console.error('Create digital license account error:', error);
    res.status(500).json({ message: error.message || 'Failed to create account.' });
  }
};

// 4. Update digital license account
exports.updateAccount = async (req, res) => {
  await ensureTables();
  try {
    const { id } = req.params;
    const {
      product_id,
      product_name,
      account_email,
      account_password,
      recovery_email,
      two_factor_status,
      two_factor_key,
      total_slots,
      status,
      expiry_date,
      vendor_id,
      vendor_name,
      purchased_date,
      renewal_date,
      purchase_price,
      renewal_cost,
      payment_method,
      invoice_no,
      notes
    } = req.body;

    const [existing] = await db.query('SELECT total_slots FROM digital_license_accounts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const oldTotal = existing[0].total_slots;
    const newTotal = parseInt(total_slots, 10) || oldTotal;

    await db.query(
      `UPDATE digital_license_accounts SET
        product_id = ?, product_name = ?, account_email = ?, account_password = ?,
        recovery_email = ?, two_factor_status = ?, two_factor_key = ?, total_slots = ?,
        status = ?, expiry_date = ?, vendor_id = ?, vendor_name = ?, purchased_date = ?,
        renewal_date = ?, purchase_price = ?, renewal_cost = ?, payment_method = ?,
        invoice_no = ?, notes = ?
      WHERE id = ?`,
      [
        product_id ? parseInt(product_id, 10) : null,
        product_name.trim(),
        account_email.trim(),
        account_password ? account_password.trim() : '',
        recovery_email ? recovery_email.trim() : null,
        two_factor_status || 'Enabled',
        two_factor_key ? two_factor_key.trim() : null,
        newTotal,
        status || 'Active',
        expiry_date || null,
        vendor_id ? parseInt(vendor_id, 10) : null,
        vendor_name ? vendor_name.trim() : null,
        purchased_date || null,
        renewal_date || null,
        purchase_price ? parseFloat(purchase_price) : 0.00,
        renewal_cost ? parseFloat(renewal_cost) : 0.00,
        payment_method || 'bKash',
        invoice_no ? invoice_no.trim() : null,
        notes || null,
        id
      ]
    );

    // Adjust slots if total_slots changed
    if (newTotal > oldTotal) {
      for (let i = oldTotal + 1; i <= newTotal; i++) {
        await db.query(
          `INSERT INTO digital_license_slots (account_id, slot_number, status) VALUES (?, ?, 'Available')`,
          [id, i]
        );
      }
    } else if (newTotal < oldTotal) {
      // Remove excess available slots
      await db.query(
        `DELETE FROM digital_license_slots WHERE account_id = ? AND slot_number > ? AND status = 'Available'`,
        [id, newTotal]
      );
    }

    res.json({ message: 'Digital license account updated successfully!' });
  } catch (error) {
    console.error('Update digital license account error:', error);
    res.status(500).json({ message: error.message || 'Failed to update account.' });
  }
};

// 5. Delete digital license account
exports.deleteAccount = async (req, res) => {
  await ensureTables();
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM digital_license_accounts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    res.json({ message: 'Account deleted successfully!' });
  } catch (error) {
    console.error('Delete digital license account error:', error);
    res.status(500).json({ message: 'Failed to delete account.' });
  }
};

// 6. Assign or update a slot
exports.assignSlot = async (req, res) => {
  await ensureTables();
  try {
    const { accountId, slotId } = req.params;
    const { order_id, assigned_to, customer_name, customer_phone, start_date, end_date, status, notes } = req.body;

    const [result] = await db.query(
      `UPDATE digital_license_slots SET
        order_id = ?,
        assigned_to = ?,
        customer_name = ?,
        customer_phone = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        notes = ?
      WHERE id = ? AND account_id = ?`,
      [
        order_id ? parseInt(order_id, 10) : null,
        assigned_to ? assigned_to.trim() : null,
        customer_name ? customer_name.trim() : null,
        customer_phone ? customer_phone.trim() : null,
        start_date || null,
        end_date || null,
        status || 'Active',
        notes || null,
        slotId,
        accountId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slot not found for this account.' });
    }

    res.json({ message: 'Slot assignment updated successfully!' });
  } catch (error) {
    console.error('Assign slot error:', error);
    res.status(500).json({ message: 'Failed to update slot assignment.' });
  }
};

// 7. Unassign / Clear a slot
exports.unassignSlot = async (req, res) => {
  await ensureTables();
  try {
    const { accountId, slotId } = req.params;

    const [result] = await db.query(
      `UPDATE digital_license_slots SET
        order_id = NULL,
        assigned_to = NULL,
        customer_name = NULL,
        customer_phone = NULL,
        start_date = NULL,
        end_date = NULL,
        status = 'Available',
        notes = NULL
      WHERE id = ? AND account_id = ?`,
      [slotId, accountId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slot not found.' });
    }

    res.json({ message: 'Slot unassigned and made available successfully!' });
  } catch (error) {
    console.error('Unassign slot error:', error);
    res.status(500).json({ message: 'Failed to unassign slot.' });
  }
};

// 8. Overall Stats summary
exports.getStatsSummary = async (req, res) => {
  await ensureTables();
  try {
    const { product_name } = req.query;
    let whereClause = '';
    const params = [];
    if (product_name && product_name !== 'all') {
      whereClause = ' WHERE dla.product_name = ?';
      params.push(product_name.trim());
    }

    const [accRows] = await db.query(
      `SELECT 
        COUNT(dla.id) AS total_accounts,
        COALESCE(SUM(dla.total_slots), 0) AS total_slots,
        COUNT(CASE WHEN dla.status = 'Expiring' OR (dla.expiry_date IS NOT NULL AND dla.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) THEN 1 END) AS expiring_soon
      FROM digital_license_accounts dla
      ${whereClause}`,
      params
    );

    let slotWhere = '';
    const slotParams = [];
    if (product_name && product_name !== 'all') {
      slotWhere = ' WHERE dla.product_name = ?';
      slotParams.push(product_name.trim());
    }

    const [slotRows] = await db.query(
      `SELECT 
        SUM(CASE WHEN dls.status = 'Active' THEN 1 ELSE 0 END) AS used_slots,
        SUM(CASE WHEN dls.status = 'Available' OR dls.status IS NULL THEN 1 ELSE 0 END) AS available_slots
      FROM digital_license_slots dls
      JOIN digital_license_accounts dla ON dls.account_id = dla.id
      ${slotWhere}`,
      slotParams
    );

    const totalAccounts = accRows[0]?.total_accounts || 0;
    const totalSlots = accRows[0]?.total_slots || 0;
    const usedSlots = slotRows[0]?.used_slots || 0;
    const availableSlots = Math.max(0, totalSlots - usedSlots);
    const expiringSoon = accRows[0]?.expiring_soon || 0;

    res.json({
      totalAccounts,
      totalSlots,
      usedSlots,
      availableSlots,
      expiringSoon
    });
  } catch (error) {
    console.error('Get stats summary error:', error);
    res.status(500).json({ message: 'Failed to calculate stats.' });
  }
};

// 9. Lookup Order by ID for slot assignment
exports.lookupOrder = async (req, res) => {
  try {
    const rawId = req.params.orderId;
    const orderId = parseInt(rawId.toString().replace(/[^0-9]/g, '').trim(), 10);
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const [orders] = await db.query(
      `SELECT o.id, o.user_id, o.phone, o.delivery_email, o.total_amount, o.status, o.payment_status, o.created_at,
              u.name AS user_name, u.email AS user_email, u.whatsapp_number AS user_whatsapp,
              COALESCE(
                (SELECT GROUP_CONCAT(COALESCE(p.name, oi.package_name) SEPARATOR ', ') 
                 FROM order_items oi 
                 LEFT JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = o.id), 
                'Digital Item'
              ) AS product_summary
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order #' + orderId + ' not found.' });
    }

    const order = orders[0];
    res.json({
      order_id: order.id,
      customer_name: (order.user_name || '').trim() || 'Customer',
      customer_email: (order.delivery_email || order.user_email || '').trim(),
      customer_phone: (order.phone || order.user_whatsapp || '').trim(),
      created_at: order.created_at,
      product_summary: order.product_summary,
      status: order.status,
      payment_status: order.payment_status
    });
  } catch (error) {
    console.error('Lookup order error:', error);
    res.status(500).json({ message: 'Failed to look up order.' });
  }
};

// 10. Get recent orders for quick auto-fill picker
exports.getRecentOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.created_at, o.phone, o.delivery_email,
              u.name AS user_name, u.email AS user_email,
              (SELECT COALESCE(p.name, oi.package_name) FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id LIMIT 1) AS product_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.id DESC
       LIMIT 30`
    );
    res.json(orders);
  } catch (error) {
    console.error('Fetch recent orders error:', error);
    res.status(500).json({ message: 'Failed to fetch recent orders.' });
  }
};
