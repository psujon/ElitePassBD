const db = require('./config/db');

async function checkOrders() {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.name, 
             COALESCE((SELECT SUM(quantity) FROM order_items WHERE product_id = p.id), 0) as total_sold
      FROM products p
      LIMIT 10
    `);
    console.log('PRODUCTS TOTAL SOLD FROM ORDERS:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkOrders();
