const db = require('./config/db');

async function run() {
  try {
    const pool = db.getPool();
    console.log('Adding purchase_email_sent column to orders table if not exists...');

    const [columns] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'purchase_email_sent'`);
    if (columns.length === 0) {
      await pool.query(`ALTER TABLE orders ADD COLUMN purchase_email_sent TINYINT DEFAULT 0 AFTER review_email_sent`);
      console.log('Successfully added purchase_email_sent column to orders table.');
    } else {
      console.log('purchase_email_sent column already exists in orders table.');
    }
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    setTimeout(() => process.exit(0), 500);
  }
}

run();
