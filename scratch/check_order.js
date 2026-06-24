const db = require('../config/db');

async function checkOrder() {
  // Wait a moment for async DB pool connection setup to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    const [rows] = await db.query('SELECT id, total_amount, payment_method, transaction_id, payment_status, status FROM orders WHERE id = 6');
    console.log('Order Details:', rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error querying order:', error);
    process.exit(1);
  }
}

checkOrder();
