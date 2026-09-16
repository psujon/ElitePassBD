const db = require('../config/db');
const { processSubscriptionStatuses } = require('../services/subscriptionCronService');
const { getDirectWhatsAppUrl, replaceTemplateTags } = require('../services/whatsappService');

/**
 * Calculate dashboard stat counts
 */
const getDashboardStats = async (pool) => {
  const [[activeRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('Active', 'Expiring Soon') AND expiry_date >= CURDATE()`);
  const [[expiringTodayRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE expiry_date = CURDATE() AND status NOT IN ('Cancelled')`);
  const [[within3DaysRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status NOT IN ('Cancelled')`);
  const [[within7DaysRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status NOT IN ('Cancelled')`);
  const [[expiredRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'Expired' OR (expiry_date < CURDATE() AND status != 'Cancelled')`);
  const [[renewedRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'Renewed' OR id IN (SELECT DISTINCT subscription_id FROM subscription_renewals WHERE status = 'Previous')`);
  const [[totalCustomersRes]] = await pool.query(`SELECT COUNT(DISTINCT whatsapp_number) as count FROM subscriptions`);
  const [[totalSubscriptionsRes]] = await pool.query(`SELECT COUNT(*) as count FROM subscriptions`);

  return {
    active: activeRes ? activeRes.count : 0,
    expiringToday: expiringTodayRes ? expiringTodayRes.count : 0,
    within3Days: within3DaysRes ? within3DaysRes.count : 0,
    within7Days: within7DaysRes ? within7DaysRes.count : 0,
    expired: expiredRes ? expiredRes.count : 0,
    renewed: renewedRes ? renewedRes.count : 0,
    totalCustomers: totalCustomersRes ? totalCustomersRes.count : 0,
    totalSubscriptions: totalSubscriptionsRes ? totalSubscriptionsRes.count : 0
  };
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const pool = db.getPool();
    await processSubscriptionStatuses(pool);

    const { search, product, status, source, expiryFilter } = req.query;

    let query = `SELECT * FROM subscriptions WHERE 1=1`;
    const params = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (customer_name LIKE ? OR whatsapp_number LIKE ? OR email LIKE ? OR product_name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (product && product.trim() && product !== 'All Products') {
      query += ` AND product_name = ?`;
      params.push(product.trim());
    }

    if (status && status.trim() && status !== 'All Status') {
      query += ` AND status = ?`;
      params.push(status.trim());
    }

    if (source && source.trim() && source !== 'All Sources') {
      query += ` AND customer_source = ?`;
      params.push(source.trim());
    }

    if (expiryFilter) {
      if (expiryFilter === 'today') {
        query += ` AND expiry_date = CURDATE()`;
      } else if (expiryFilter === '3days') {
        query += ` AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)`;
      } else if (expiryFilter === '7days') {
        query += ` AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
      } else if (expiryFilter === 'expired') {
        query += ` AND (expiry_date < CURDATE() OR status = 'Expired')`;
      }
    }

    query += ` ORDER BY expiry_date ASC, id DESC`;

    const [rows] = await pool.query(query, params);

    // Fetch settings for direct WhatsApp message link generator
    const [settingRows] = await pool.query('SELECT setting_key, setting_value FROM subscription_settings');
    const settings = {};
    settingRows.forEach(s => settings[s.setting_key] = s.setting_value);
    const waTemplate = settings.whatsapp_template || `Hello {customer_name}, your {product_name} subscription expires on {expiry_date}. Please complete renewal payment to continue. Thank you, ElitePassBD.`;

    // Attach direct wa.me link to each subscription item
    const items = rows.map(sub => {
      const formattedExpiry = sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '';
      const text = replaceTemplateTags(waTemplate, {
        customer_name: sub.customer_name,
        product_name: sub.product_name,
        package_plan: sub.package_plan,
        expiry_date: formattedExpiry
      });
      return {
        ...sub,
        direct_whatsapp_url: getDirectWhatsAppUrl(sub.whatsapp_number, text)
      };
    });

    const stats = await getDashboardStats(pool);

    res.json({
      stats,
      subscriptions: items
    });
  } catch (err) {
    console.error('Get all subscriptions error:', err);
    res.status(500).json({ message: 'Database error fetching subscriptions.' });
  }
};

exports.getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    const [subs] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    if (subs.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const sub = subs[0];

    const [renewals] = await pool.query('SELECT * FROM subscription_renewals WHERE subscription_id = ? ORDER BY id DESC', [id]);
    const [reminders] = await pool.query('SELECT * FROM subscription_reminders WHERE subscription_id = ? ORDER BY id DESC', [id]);

    res.json({
      ...sub,
      renewals,
      reminders
    });
  } catch (err) {
    console.error('Get subscription detail error:', err);
    res.status(500).json({ message: 'Error fetching subscription details.' });
  }
};

exports.createSubscription = async (req, res) => {
  const {
    customer_name,
    whatsapp_number,
    email,
    product_name,
    package_plan,
    customer_source,
    purchase_date,
    validity_days,
    expiry_date,
    account_given,
    selling_price,
    payment_status,
    notes,
    order_id
  } = req.body;

  if (!customer_name || !whatsapp_number || !product_name || !package_plan) {
    return res.status(400).json({ message: 'Customer Name, WhatsApp Number, Product Name, and Package Plan are required.' });
  }

  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const pDate = purchase_date ? new Date(purchase_date) : new Date();
    const vDays = parseInt(validity_days) || 30;

    let eDate;
    if (expiry_date) {
      eDate = new Date(expiry_date);
    } else {
      eDate = new Date(pDate);
      eDate.setDate(eDate.getDate() + vDays);
    }

    const formattedPDate = pDate.toISOString().slice(0, 10);
    const formattedEDate = eDate.toISOString().slice(0, 10);

    const todayStr = new Date().toISOString().slice(0, 10);
    let initialStatus = 'Active';
    if (formattedEDate < todayStr) {
      initialStatus = 'Expired';
    } else {
      const diffTime = new Date(formattedEDate) - new Date(todayStr);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        initialStatus = 'Expiring Soon';
      }
    }

    let finalOrderId = order_id || null;

    // If no existing order_id is provided (Manual / WhatsApp / Facebook entry), create an order in orders & order_items tables
    if (!finalOrderId) {
      try {
        let userId = null;

        // 1. Find or create user
        if (email && email.trim()) {
          const [userCheck] = await connection.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
          if (userCheck.length > 0) {
            userId = userCheck[0].id;
          } else {
            const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const [newUserRes] = await connection.query(
              'INSERT INTO users (name, email, password, role, whatsapp_number) VALUES (?, ?, ?, "user", ?)',
              [customer_name, email.trim(), hashedPassword, whatsapp_number]
            );
            userId = newUserRes.insertId;
          }
        } else {
          // Fallback to Admin User or system user
          const [adminCheck] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
          userId = adminCheck.length > 0 ? adminCheck[0].id : 1;
        }

        // 2. Find product_id
        let productId = 1;
        const [prodCheck] = await connection.query('SELECT id FROM products WHERE name LIKE ? LIMIT 1', [`%${product_name}%`]);
        if (prodCheck.length > 0) {
          productId = prodCheck[0].id;
        } else {
          const [firstProd] = await connection.query('SELECT id FROM products ORDER BY id ASC LIMIT 1');
          if (firstProd.length > 0) productId = firstProd[0].id;
        }

        // 3. Create Order
        const ordStatus = (payment_status === 'Paid') ? 'Delivered' : 'Pending';
        const [ordRes] = await connection.query(`
          INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, payment_method, payment_status, delivery_email, additional_notes, completed_at)
          VALUES (?, ?, ?, 'Manual / Social Order', ?, ?, ?, ?, ?, IF(? = 'Delivered', NOW(), NULL))
        `, [
          userId,
          parseFloat(selling_price) || 0,
          ordStatus,
          whatsapp_number,
          customer_source || 'Manual Order',
          payment_status || 'Paid',
          email || null,
          notes || null,
          ordStatus
        ]);

        finalOrderId = ordRes.insertId;

        // 4. Create Order Item
        await connection.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price, package_name, selected_activation)
          VALUES (?, ?, 1, ?, ?, ?)
        `, [
          finalOrderId,
          productId,
          parseFloat(selling_price) || 0,
          package_plan,
          account_given || null
        ]);
      } catch (ordErr) {
        console.error('Manual order sync error during subscription creation:', ordErr.message);
      }
    }

    const [subResult] = await connection.query(`
      INSERT INTO subscriptions (
        customer_name, whatsapp_number, email, product_name, package_plan,
        customer_source, purchase_date, validity_days, expiry_date, account_given,
        selling_price, payment_status, status, notes, order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_name,
      whatsapp_number,
      email || null,
      product_name,
      package_plan,
      customer_source || 'Manual',
      formattedPDate,
      vDays,
      formattedEDate,
      account_given || null,
      parseFloat(selling_price) || 0,
      payment_status || 'Paid',
      initialStatus,
      notes || null,
      finalOrderId
    ]);

    const subscriptionId = subResult.insertId;

    // Add initial record in subscription_renewals
    await connection.query(`
      INSERT INTO subscription_renewals (subscription_id, start_date, end_date, validity_days, amount, status, notes)
      VALUES (?, ?, ?, ?, ?, 'Current', 'Initial purchase')
    `, [
      subscriptionId,
      formattedPDate,
      formattedEDate,
      vDays,
      parseFloat(selling_price) || 0
    ]);

    await connection.commit();

    // Trigger Purchase Confirmation Email to customer's email address if order created
    if (finalOrderId) {
      const { sendPurchaseConfirmationEmail } = require('../services/purchaseEmailService');
      sendPurchaseConfirmationEmail(finalOrderId).catch(emailErr => {
        console.error('Failed to send purchase email for manual subscription order:', emailErr.message);
      });
    }

    res.status(201).json({
      message: 'Customer subscription created successfully and linked to Orders!',
      subscriptionId,
      orderId: finalOrderId
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create subscription error:', err);
    res.status(500).json({ message: err.message || 'Failed to create subscription.' });
  } finally {
    connection.release();
  }
};

exports.updateSubscription = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    whatsapp_number,
    email,
    product_name,
    package_plan,
    customer_source,
    purchase_date,
    validity_days,
    expiry_date,
    account_given,
    selling_price,
    payment_status,
    status,
    notes
  } = req.body;

  try {
    const pool = db.getPool();
    const [subCheck] = await pool.query('SELECT id FROM subscriptions WHERE id = ?', [id]);
    if (subCheck.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const pDate = purchase_date ? new Date(purchase_date).toISOString().slice(0, 10) : undefined;
    const eDate = expiry_date ? new Date(expiry_date).toISOString().slice(0, 10) : undefined;

    await pool.query(`
      UPDATE subscriptions SET
        customer_name = COALESCE(?, customer_name),
        whatsapp_number = COALESCE(?, whatsapp_number),
        email = ?,
        product_name = COALESCE(?, product_name),
        package_plan = COALESCE(?, package_plan),
        customer_source = COALESCE(?, customer_source),
        purchase_date = COALESCE(?, purchase_date),
        validity_days = COALESCE(?, validity_days),
        expiry_date = COALESCE(?, expiry_date),
        account_given = ?,
        selling_price = COALESCE(?, selling_price),
        payment_status = COALESCE(?, payment_status),
        status = COALESCE(?, status),
        notes = ?
      WHERE id = ?
    `, [
      customer_name,
      whatsapp_number,
      email !== undefined ? email : null,
      product_name,
      package_plan,
      customer_source,
      pDate,
      validity_days ? parseInt(validity_days) : undefined,
      eDate,
      account_given !== undefined ? account_given : null,
      selling_price !== undefined ? parseFloat(selling_price) : undefined,
      payment_status,
      status,
      notes !== undefined ? notes : null,
      id
    ]);

    res.json({ message: 'Subscription updated successfully!' });
  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ message: 'Failed to update subscription.' });
  }
};

exports.renewSubscription = async (req, res) => {
  const { id } = req.params;
  const { renewal_date, validity_days, new_expiry_date, payment_amount, notes, package_plan } = req.body;

  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [subCheck] = await connection.query('SELECT * FROM subscriptions WHERE id = ? FOR UPDATE', [id]);
    if (subCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const sub = subCheck[0];
    const rDate = renewal_date ? new Date(renewal_date) : new Date();
    const vDays = parseInt(validity_days) || 30;

    let eDate;
    if (new_expiry_date) {
      eDate = new Date(new_expiry_date);
    } else {
      eDate = new Date(rDate);
      eDate.setDate(eDate.getDate() + vDays);
    }

    const formattedRDate = rDate.toISOString().slice(0, 10);
    const formattedEDate = eDate.toISOString().slice(0, 10);
    const amount = payment_amount !== undefined ? parseFloat(payment_amount) : parseFloat(sub.selling_price);

    // Mark previous renewals as 'Previous'
    await connection.query('UPDATE subscription_renewals SET status = "Previous" WHERE subscription_id = ?', [id]);

    // Insert new renewal history entry
    await connection.query(`
      INSERT INTO subscription_renewals (subscription_id, start_date, end_date, validity_days, amount, status, notes)
      VALUES (?, ?, ?, ?, ?, 'Current', ?)
    `, [
      id,
      formattedRDate,
      formattedEDate,
      vDays,
      amount,
      notes || 'Subscription renewed'
    ]);

    // Update main subscription record
    await connection.query(`
      UPDATE subscriptions SET
        purchase_date = ?,
        validity_days = ?,
        expiry_date = ?,
        selling_price = ?,
        package_plan = COALESCE(?, package_plan),
        payment_status = 'Paid',
        status = 'Renewed',
        updated_at = NOW()
      WHERE id = ?
    `, [
      formattedRDate,
      vDays,
      formattedEDate,
      amount,
      package_plan || null,
      id
    ]);

    await connection.commit();

    res.json({ message: `Subscription for ${sub.customer_name} renewed successfully until ${formattedEDate}!` });
  } catch (err) {
    await connection.rollback();
    console.error('Renew subscription error:', err);
    res.status(500).json({ message: err.message || 'Failed to renew subscription.' });
  } finally {
    connection.release();
  }
};

exports.deleteSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    res.json({ message: 'Subscription deleted successfully.' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ message: 'Failed to delete subscription.' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM subscription_settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  const settingsObj = req.body;
  if (!settingsObj || typeof settingsObj !== 'object') {
    return res.status(400).json({ message: 'Invalid settings payload.' });
  }

  const pool = db.getPool();
  try {
    for (const [key, value] of Object.entries(settingsObj)) {
      await pool.query(
        'INSERT INTO subscription_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Subscription settings updated successfully!' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};
