const db = require('./config/db');

async function testJoin() {
  try {
    const [rows] = await db.query(`
      SELECT pl.*, p.name AS product_name, o.created_at AS order_used_at, o.id AS order_id
      FROM product_licenses pl
      JOIN products p ON pl.product_id = p.id
      LEFT JOIN order_items oi ON pl.order_item_id = oi.id
      LEFT JOIN orders o ON oi.order_id = o.id
      ORDER BY pl.id DESC
      LIMIT 10
    `);
    console.log('JOIN RESULTS:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

testJoin();
