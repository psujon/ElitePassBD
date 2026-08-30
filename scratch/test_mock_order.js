const db = require('../config/db');
const { processPendingReviewEmails } = require('../services/reviewEmailService');

async function testOrder() {
  console.log('--- Testing Mock Delivered Order Dispatch ---');
  try {
    const pool = db.getPool();

    // Check if test user exists or get first user
    const [users] = await pool.query('SELECT id, email FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No user found to create test order.');
      return;
    }
    const user = users[0];

    const [products] = await pool.query('SELECT id FROM products LIMIT 1');
    if (products.length === 0) {
      console.log('No product found to create test order.');
      return;
    }
    const product = products[0];

    // Insert mock order completed 15 mins ago
    const [orderRes] = await pool.query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, delivery_email, review_email_sent, completed_at)
      VALUES (?, 100, 'Delivered', 'Test address', '01700000000', ?, 0, NOW() - INTERVAL 15 MINUTE)
    `, [user.id, user.email]);

    const orderId = orderRes.insertId;

    await pool.query(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, 1, 100)
    `, [orderId, product.id]);

    console.log(`Created mock delivered order #${orderId} with completed_at = 15 mins ago.`);

    console.log('Running processPendingReviewEmails()...');
    await processPendingReviewEmails();

    // Verify review_email_sent flag
    const [updatedOrder] = await pool.query('SELECT id, review_email_sent FROM orders WHERE id = ?', [orderId]);
    console.log(`Order #${orderId} review_email_sent status:`, updatedOrder[0].review_email_sent);

    // Clean up test order
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    console.log(`Cleaned up test order #${orderId}.`);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
}

setTimeout(testOrder, 1000);
