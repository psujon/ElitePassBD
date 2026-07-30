const db = require('./config/db');

async function run() {
  console.log('Database init script completed.');
  setTimeout(() => process.exit(0), 1000);
}

run();
