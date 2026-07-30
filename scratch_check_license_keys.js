const db = require('./config/db');

async function checkLicenseTable() {
  try {
    const [columns] = await db.query(`DESCRIBE product_licenses`);
    console.log('PRODUCT_LICENSES COLUMNS:', JSON.stringify(columns, null, 2));

    const [rows] = await db.query(`SELECT * FROM product_licenses ORDER BY id DESC LIMIT 10`);
    console.log('PRODUCT_LICENSES SAMPLE ROWS:', JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkLicenseTable();
