const db = require('./config/db');

async function check() {
  try {
    const [prods] = await db.query("SELECT id, name, highlighted_text FROM products LIMIT 10");
    console.log('PRODUCTS IN DB:', JSON.stringify(prods, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

check();
