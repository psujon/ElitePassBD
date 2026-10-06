const db = require('../config/db');
const { sendPurchaseConfirmationEmail } = require('../services/purchaseEmailService');
const { syncWebsiteOrderToSubscriptions } = require('../services/orderSubscriptionSyncService');

exports.createOrder = async (req, res) => {
  const { items, total_amount, shipping_address, phone, payment_method, additional_notes, delivery_email, coupon_code, discount_amount } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required to place an order.' });
  }
  if (!phone) {
    return res.status(400).json({ message: 'Phone number are required.' });
  }

  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const firstIp = ip.split(',')[0].trim();
    const cleanIp = firstIp.startsWith('::ffff:') ? firstIp.substring(7) : firstIp;
    const userAgent = req.headers['user-agent'] || '';

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, phone, payment_method, additional_notes, delivery_email, client_ip, client_user_agent, coupon_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, total_amount, shipping_address, phone, payment_method || 'Cash on Delivery', additional_notes || null, delivery_email || null, cleanIp, userAgent, coupon_code || null, discount_amount ? parseFloat(discount_amount) : 0]
    );
    const orderId = orderResult.insertId;

    if (coupon_code && coupon_code.trim()) {
      await connection.query(
        'UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = ?',
        [coupon_code.trim().toUpperCase()]
      );
    }

    for (const item of items) {
      const { product_id, quantity, price, package_name, selected_device, selected_activation } = item;

      if (!product_id || !quantity || !price) {
        throw new Error('Invalid item details in cart.');
      }

      const [stockCheck] = await connection.query(
        'SELECT stock, name, packages, is_deleted FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (stockCheck.length === 0 || stockCheck[0].is_deleted === 1) {
        throw new Error(`Product not found or is no longer available.`);
      }

      const productName = stockCheck[0].name;
      const dbPackagesStr = stockCheck[0].packages;
      let packages = [];
      try {
        packages = dbPackagesStr ? (typeof dbPackagesStr === 'string' ? JSON.parse(dbPackagesStr) : dbPackagesStr) : [];
      } catch (e) {
        packages = [];
      }

      if (packages && packages.length > 0) {
        const matchedPkg = packages.find(p => 
          p.duration === package_name && 
          (!p.activation || !selected_activation || p.activation.toLowerCase() === selected_activation.toLowerCase())
        );

        if (matchedPkg) {
          const pkgStock = parseInt(matchedPkg.stock);
          if (!isNaN(pkgStock)) {
            if (pkgStock < quantity) {
              throw new Error(`Insufficient stock for package "${package_name}" of product "${productName}". Available: ${pkgStock}`);
            }
            matchedPkg.stock = pkgStock - quantity;
            
            const totalStock = packages.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
            
            await connection.query(
              'UPDATE products SET stock = ?, packages = ? WHERE id = ?',
              [totalStock, JSON.stringify(packages), product_id]
            );
          } else {
            const currentStock = stockCheck[0].stock;
            if (currentStock < quantity) {
              throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
            }
            await connection.query(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [quantity, product_id]
            );
          }
        } else {
          const currentStock = stockCheck[0].stock;
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
          }
          await connection.query(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [quantity, product_id]
          );
        }
      } else {
        const currentStock = stockCheck[0].stock;
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
        }
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [quantity, product_id]
        );
      }

      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, package_name, selected_device, selected_activation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, product_id, quantity, price, package_name || null, selected_device || null, selected_activation || null]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: orderId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation transaction failed:', error.message);
    res.status(400).json({ message: error.message || 'Failed to place order.' });
  } finally {
    connection.release();
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, COALESCE(p.name, 'Archived Product') as product_name, p.image_url 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      for (const item of items) {
        const [licenses] = await db.query(
          'SELECT license_key, rules FROM product_licenses WHERE order_item_id = ?',
          [item.id]
        );
        item.licenses = licenses;
        item.license_keys = licenses.map(l => l.license_key);
      }

      ordersWithItems.push({
        ...order,
        items
      });
    }

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching orders.' });
  }
};

exports.trackOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    if (order.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this order.' });
    }

    const [items] = await db.query(
      `SELECT oi.*, COALESCE(p.name, 'Archived Product') as product_name, p.image_url 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    for (const item of items) {
      const [licenses] = await db.query(
        'SELECT license_key, rules FROM product_licenses WHERE order_item_id = ?',
        [item.id]
      );
      item.licenses = licenses;
      item.license_keys = licenses.map(l => l.license_key);
    }

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Database error occurred while tracking order.' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.id DESC`
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, COALESCE(p.name, 'Archived Product') as product_name, p.image_url 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      for (const item of items) {
        const [licenses] = await db.query(
          'SELECT license_key, rules FROM product_licenses WHERE order_item_id = ?',
          [item.id]
        );
        item.licenses = licenses;
        item.license_keys = licenses.map(l => l.license_key);
      }

      ordersWithItems.push({
        ...order,
        items
      });
    }

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Admin get all orders error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching user orders.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, cancel_reason } = req.body;

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status value.' });
  }

  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderCheck] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (orderCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const previousStatus = orderCheck[0].status;

    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        const [prodCheck] = await connection.query(
          'SELECT stock, name FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );

        if (prodCheck.length === 0) {
          throw new Error(`Product not found for ID ${item.product_id}.`);
        }

        const currentStock = prodCheck[0].stock;
        const productName = prodCheck[0].name;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product "${productName}" to restore order. Available: ${currentStock}, Needed: ${item.quantity}`);
        }
      }

      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    if (status === 'Cancelled') {
      await connection.query(
        'UPDATE orders SET status = ?, cancel_reason = ?, completed_at = NULL, review_email_sent = 0 WHERE id = ?',
        [status, cancel_reason || 'No reason provided', id]
      );
    } else if (status === 'Delivered') {
      await connection.query(
        'UPDATE orders SET status = ?, payment_status = IF(payment_status = "Pending", "Paid", payment_status), cancel_reason = NULL, completed_at = IFNULL(completed_at, NOW()) WHERE id = ?',
        [status, id]
      );

      // Auto-create / sync subscription entry for website order with exact package duration
      try {
        await syncWebsiteOrderToSubscriptions(id, connection);
      } catch (subErr) {
        console.error('Auto subscription creation hook error:', subErr.message);
      }
    } else {
      await connection.query(
        'UPDATE orders SET status = ?, cancel_reason = NULL, completed_at = NULL, review_email_sent = 0 WHERE id = ?',
        [status, id]
      );
    }

    await connection.commit();

    if (status === 'Delivered') {
      // 1. Send Order Invoice email (if not already sent)
      sendPurchaseConfirmationEmail(id).catch(err => {
        console.error('[OrderController] Failed to send invoice email on delivery:', err.message);
      });

      // 2. Send Digital License keys email (if licenses assigned and not already sent)
      (async () => {
        try {
          const [ordRows] = await pool.query(
            `SELECT o.id, o.delivery_email, o.license_email_sent, u.name as user_name, u.email as user_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`,
            [id]
          );
          if (ordRows.length > 0 && !ordRows[0].license_email_sent) {
            const ord = ordRows[0];
            const targetEmail = ord.delivery_email || ord.user_email;
            const [licRows] = await pool.query(
              `SELECT pl.license_key, pl.rules, p.name as product_name, oi.package_name, oi.selected_device, oi.selected_activation
               FROM product_licenses pl
               JOIN order_items oi ON pl.order_item_id = oi.id
               JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ?`,
              [id]
            );
            if (licRows.length > 0 && targetEmail) {
              const { sendLicenseEmail } = require('./paymentController');
              const sent = await sendLicenseEmail(targetEmail, ord.user_name || 'Customer', ord.id, licRows);
              if (sent) {
                await pool.query('UPDATE orders SET license_email_sent = 1 WHERE id = ?', [id]);
              }
            }
          }
        } catch (licErr) {
          console.error('[OrderController] Failed to check/send license email on delivery:', licErr.message);
        }
      })();
    }

    res.json({ message: `Order status updated to ${status} successfully!` });
  } catch (error) {
    await connection.rollback();
    console.error('Update order status transaction failed:', error.message);
    res.status(400).json({ message: error.message || 'Failed to update order status.' });
  } finally {
    connection.release();
  }
};

exports.updateOrderPayment = async (req, res) => {
  const { id } = req.params;
  const { payment_method, payment_status, transaction_id } = req.body;

  try {
    const fields = [];
    const values = [];

    if (payment_method !== undefined) {
      fields.push('payment_method = ?');
      values.push(payment_method);
    }
    if (payment_status !== undefined) {
      fields.push('payment_status = ?');
      values.push(payment_status);
    }
    if (transaction_id !== undefined) {
      fields.push('transaction_id = ?');
      values.push(transaction_id || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No payment fields to update.' });
    }

    values.push(id);
    await db.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);

    if (payment_status === 'Paid') {
      sendPurchaseConfirmationEmail(id).catch(err => {
        console.error('[OrderController] Failed to send invoice on payment update:', err.message);
      });
    }

    res.json({ message: `Order #${id} payment details updated successfully!` });
  } catch (error) {
    console.error('Update order payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to update order payment.' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderCheck] = await connection.query(
      'SELECT id FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (orderCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const [orderItems] = await connection.query(
      'SELECT id FROM order_items WHERE order_id = ?',
      [id]
    );
    
    if (orderItems.length > 0) {
      const itemIds = orderItems.map(item => item.id);
      await connection.query(
        'UPDATE product_licenses SET is_used = 0, order_item_id = NULL WHERE order_item_id IN (?)',
        [itemIds]
      );
    }

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await connection.query('DELETE FROM orders WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: `Order #${id} deleted successfully!` });
  } catch (error) {
    await connection.rollback();
    console.error('Delete order error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete order.' });
  } finally {
    connection.release();
  }
};


const bcrypt = require('bcryptjs');
const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText } = require('../utils/mailer');

const sendGuestAccountEmail = async (email, name, password) => {
  try {
    const appName = process.env.APP_NAME || 'ElitePassBD';
    const frontendUrl = process.env.FRONTEND_URL || 'https://elitepassbd.com';
    const loginUrl = `${frontendUrl}/login`;

    const subject = `Your Account Credentials - ${appName}`;
    const text = `Hello ${name},\n\nAn account has been created for you at ${appName}. Here are your login details:\nEmail: ${email}\nPassword: ${password}\n\nYou can log in and view your order status at: ${loginUrl}\n\nPlease update your password after logging in.${getWhatsAppContactText()}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Credentials - ${appName}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0b1120; }
    .body-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    .body-td { padding: 0 !important; margin: 0 !important; }
    * {
      word-break: normal !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      hyphens: none !important;
      -webkit-hyphens: none !important;
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .banner-header { padding: 18px 12px !important; }
      .banner-header h1 { font-size: 17px !important; }
      .main-content { padding: 14px 10px !important; }
      .cred-card { padding: 10px 8px !important; }
      .login-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 12px 14px !important; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
  <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0b1120; margin: 0; padding: 0; border-collapse: collapse;">
    <tr>
      <td align="center" class="body-td" style="padding: 0; margin: 0;">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 0; overflow: hidden; border: 1px solid #334155;">
          
          <!-- Banner Header -->
          <tr>
            <td class="banner-header" style="background-color: #059669; color: #ffffff; padding: 20px 14px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                Welcome to ${appName}!
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                Your Account Credentials & Access Details
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
              <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-weight: 600;">
                Hello ${name},
              </p>
              <p style="font-size: 12px; line-height: 1.55; color: #cbd5e1; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                An account has been created for you so you can easily track your orders, view license keys, and manage subscriptions. Below are your login credentials:
              </p>

              <!-- Credentials Card -->
              <div class="cred-card" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px; width: 35%;">Name:</td>
                    <td style="padding: 5px 0; color: #ffffff; font-size: 12px; font-weight: 600; word-break: normal; overflow-wrap: break-word;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Login Email:</td>
                    <td style="padding: 5px 0; color: #ffffff; font-size: 12px; font-weight: 600; word-break: normal; overflow-wrap: break-word;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Password:</td>
                    <td style="padding: 5px 0;">
                      <code style="background-color: #1e293b; color: #34d399; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; word-break: normal; overflow-wrap: break-word;">${password}</code>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Recommendation Note -->
              <p style="font-size: 11.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; word-break: normal; overflow-wrap: break-word;">
                💡 <em>Tip: For security, please log in and change your password in your Profile Settings.</em>
              </p>

              <!-- Login CTA Button -->
              <div style="text-align: center; margin: 18px 0 10px 0;">
                <a href="${loginUrl}" target="_blank" class="login-btn" style="background-color: #059669; color: #ffffff; padding: 11px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); max-width: 100%;">
                  Log In To Your Account
                </a>
              </div>

              <!-- WhatsApp Support Contact Box -->
              ${getWhatsAppContactBlock(true)}
            </td>
          </tr>

          <!-- Footer -->
          ${getEmailFooter(appName, true)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const sent = await sendEmail({
      to: email,
      subject,
      text,
      html
    });
    if (sent) {
      console.log(`Guest credentials email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error('Failed to send guest credentials email:', error);
  }
};

exports.createGuestOrder = async (req, res) => {
  const { items, total_amount, shipping_address, phone, payment_method, additional_notes, guest_name, guest_email, delivery_email } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required to place an order.' });
  }

  if (!guest_name || !guest_email) {
    return res.status(400).json({ message: 'Guest name and email address are required.' });
  }

  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [guest_email]);
    let userId;
    let isNewUser = false;
    let randomPassword = '';

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'This email is already registered. Please log in to complete your checkout.' });
    } else {
      isNewUser = true;
      randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (name, email, password, role, whatsapp_number) VALUES (?, ?, ?, "user", ?)',
        [guest_name, guest_email, hashedPassword, phone || null]
      );
      userId = userResult.insertId;
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const firstIp = ip.split(',')[0].trim();
    const cleanIp = firstIp.startsWith('::ffff:') ? firstIp.substring(7) : firstIp;
    const userAgent = req.headers['user-agent'] || '';

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, phone, payment_method, additional_notes, delivery_email, client_ip, client_user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, total_amount, shipping_address, phone || 'Not Provided', payment_method || 'Cash on Delivery', additional_notes || null, delivery_email || guest_email || null, cleanIp, userAgent]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const { product_id, quantity, price, package_name, selected_device, selected_activation } = item;

      if (!product_id || !quantity || !price) {
        throw new Error('Invalid item details in cart.');
      }

      const [stockCheck] = await connection.query(
        'SELECT stock, name, packages, is_deleted FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (stockCheck.length === 0 || stockCheck[0].is_deleted === 1) {
        throw new Error(`Product not found or is no longer available.`);
      }

      const productName = stockCheck[0].name;
      const dbPackagesStr = stockCheck[0].packages;
      let packages = [];
      try {
        packages = dbPackagesStr ? (typeof dbPackagesStr === 'string' ? JSON.parse(dbPackagesStr) : dbPackagesStr) : [];
      } catch (e) {
        packages = [];
      }

      if (packages && packages.length > 0) {
        const matchedPkg = packages.find(p => 
          p.duration === package_name && 
          (!p.activation || !selected_activation || p.activation.toLowerCase() === selected_activation.toLowerCase())
        );

        if (matchedPkg) {
          const pkgStock = parseInt(matchedPkg.stock);
          if (!isNaN(pkgStock)) {
            if (pkgStock < quantity) {
              throw new Error(`Insufficient stock for package "${package_name}" of product "${productName}". Available: ${pkgStock}`);
            }
            matchedPkg.stock = pkgStock - quantity;
            
            const totalStock = packages.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
            
            await connection.query(
              'UPDATE products SET stock = ?, packages = ? WHERE id = ?',
              [totalStock, JSON.stringify(packages), product_id]
            );
          } else {
            const currentStock = stockCheck[0].stock;
            if (currentStock < quantity) {
              throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
            }
            await connection.query(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [quantity, product_id]
            );
          }
        } else {
          const currentStock = stockCheck[0].stock;
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
          }
          await connection.query(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [quantity, product_id]
          );
        }
      } else {
        const currentStock = stockCheck[0].stock;
        if (currentStock < quantity) {
          throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
        }
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [quantity, product_id]
        );
      }

      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, package_name, selected_device, selected_activation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, product_id, quantity, price, package_name || null, selected_device || null, selected_activation || null]
      );
    }

    await connection.commit();

    if (isNewUser) {
      sendGuestAccountEmail(guest_email, guest_name, randomPassword);
    }

    res.status(201).json({
      message: 'Order placed successfully! Check your email for login credentials.',
      orderId: orderId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Guest order transaction failed:', error.message);
    res.status(400).json({ message: error.message || 'Failed to place order.' });
  } finally {
    connection.release();
  }
};
