const db = require('../config/db');

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
        'SELECT stock, name, packages FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (stockCheck.length === 0) {
        throw new Error(`Product not found.`);
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
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
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
      `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
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
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
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
        'UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?',
        [status, cancel_reason || 'No reason provided', id]
      );
    } else {
      await connection.query(
        'UPDATE orders SET status = ?, cancel_reason = NULL WHERE id = ?',
        [status, id]
      );
    }

    await connection.commit();
    res.json({ message: `Order status updated to ${status} successfully!` });
  } catch (error) {
    await connection.rollback();
    console.error('Update order status transaction failed:', error.message);
    res.status(400).json({ message: error.message || 'Failed to update order status.' });
  } finally {
    connection.release();
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


const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const sendGuestAccountEmail = async (email, name, password) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'ElitePassBD'}" <${smtpUser}>`,
        to: email,
        subject: 'Your Account Credentials - ElitePassBD',
        text: `Hello ${name},\n\nAn account has been created for you. Here are your login details:\nName: [${name}], email: [${email}], password: [${password}]\n\nYou can log in and view your order status here.`,
        html: `<h3>Welcome to ElitePassBD</h3>
               <p>Hello <strong>${name}</strong>,</p>
               <p>An account has been created for you. Here are your temporary login credentials to track your orders:</p>
               <p><strong>Login Details:</strong><br>
                  Name: [${name}]<br>
                  email: [${email}]<br>
                  password: [${password}]
               </p>
               <p>Please log in and update your password under your profile settings.</p>`
      });
      console.log(`Guest credentials email sent successfully to ${email}`);
    } else {
      console.log('----------------------------');
      console.log(`MOCK SMTP: Guest Credentials -> Name: [${name}], email: [${email}], password: [REDACTED]`);
      console.log('----------------------------');
    }
  } catch (error) {
    console.error('Failed to send guest credentials email:', error);
    console.log('----------------------------');
    console.log(`FALLBACK: Guest Credentials -> Name: [${name}], email: [${email}], password: [REDACTED]`);
    console.log('----------------------------');
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
        'SELECT stock, name, packages FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (stockCheck.length === 0) {
        throw new Error(`Product not found.`);
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
