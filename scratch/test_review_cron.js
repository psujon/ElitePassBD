const db = require('../config/db');
const { processPendingReviewEmails } = require('../services/reviewEmailService');

async function test() {
  console.log('--- Testing DB Migration & Review Email Cron ---');
  try {
    const pool = db.getPool();

    // Check if columns exist
    const [cols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'review_email_sent'");
    console.log('review_email_sent column exists:', cols.length > 0);

    const [compCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'completed_at'");
    console.log('completed_at column exists:', compCols.length > 0);

    // Call pending process
    console.log('Triggering processPendingReviewEmails()...');
    await processPendingReviewEmails();

    console.log('Test completed successfully.');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
}

test();
