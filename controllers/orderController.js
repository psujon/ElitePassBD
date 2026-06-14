const db = require('../config/db');

// Create Order (User)
exports.createOrder = async (req, res) => {
  const { items, total_amount, shipping_address, phone, payment_method, additional_notes } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required to place an order.' });
  }
  if (!shipping_address || !phone) {
    return res.status(400).json({ message: 'Shipping address and phone number are required.' });
  }

  // Get database pool to perform transaction
  const pool = db.getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert order record
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, phone, payment_method, additional_notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, total_amount, shipping_address, phone, payment_method || 'Cash on Delivery', additional_notes || null]
    );
    const orderId = orderResult.insertId;

    // 2. Insert order items & update product stock
    for (const item of items) {
      const { product_id, quantity, price, package_name, selected_device, selected_activation } = item;

      if (!product_id || !quantity || !price) {
        throw new Error('Invalid item details in cart.');
      }

      // Check stock and deduct it
      const [stockCheck] = await connection.query(
        'SELECT stock, name FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (stockCheck.length === 0) {
        throw new Error(`Product not found.`);
      }

      const currentStock = stockCheck[0].stock;
      const productName = stockCheck[0].name;

      if (currentStock < quantity) {
        throw new Error(`Insufficient stock for product: "${productName}". Available stock: ${currentStock}`);
      }

      // Deduct stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, product_id]
      );

      // Insert order item
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

// Get My Orders (User)
exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    // Fetch user orders
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Fetch items for each order
    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
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

// Track Specific Order (User / Admin)
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

    // Authorize: Only the placing user or an admin can track the order details
    if (order.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You do not own this order.' });
    }

    // Fetch order items
    const [items] = await db.query(
      `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Database error occurred while tracking order.' });
  }
};

// Get All Orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    // Fetch all orders with user name and email
    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
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

// Update Order Status (Admin)
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

    // 1. Fetch current order status
    const [orderCheck] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (orderCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Order not found.' });
    }

    const previousStatus = orderCheck[0].status;

    // 2. If status is changing to Cancelled (and wasn't Cancelled already), restock items
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

    // 3. If status is changing FROM Cancelled to something else, deduct stock
    if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      // Verify stock availability first
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

      // Deduct stock
      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // 4. Update the order status and cancel reason
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
