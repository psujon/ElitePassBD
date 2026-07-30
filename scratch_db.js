const db = require('./config/db');

async function migrate() {
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM products LIKE 'highlighted_text'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE products ADD COLUMN highlighted_text TEXT DEFAULT NULL");
      console.log("Successfully added column 'highlighted_text' to 'products' table in MySQL!");
    } else {
      console.log("Column 'highlighted_text' already exists in MySQL!");
    }
    process.exit(0);
  } catch (e) {
    console.error('Migration Error:', e);
    process.exit(1);
  }
}

migrate();
