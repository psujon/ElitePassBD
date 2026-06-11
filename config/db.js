const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 0,
  queueLimit: 0
};

let pool;

async function initDB() {
  try {
    const dbName = process.env.DB_NAME || 'elitepass_db';

    // Try creating the database if privileges allow (mainly for local development)
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();
    } catch (dbCreateError) {
      console.log(`Note: Database auto-creation bypassed or failed (${dbCreateError.message}). Attempting direct connection...`);
    }

    // 2. Create the connection pool with DB name
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${dbName}`);

    // 3. Create tables if they don't exist
    await createTables();

    // 4. Update schema if columns are missing
    await updateSchema();

  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      whatsapp_number VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      image_url TEXT,
      stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const ordersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
      cancel_reason VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const orderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
  `;

  const reviewsTable = `
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      rating INT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_product (user_id, product_id)
    );
  `;

  const supportTicketsTable = `
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('Pending', 'Resolved', 'Closed') DEFAULT 'Pending',
      remarks TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `;

  await pool.query(usersTable);
  await pool.query(productsTable);
  await pool.query(ordersTable);
  await pool.query(orderItemsTable);
  await pool.query(reviewsTable);
  await pool.query(supportTicketsTable);

  // Seed default admin if not exists
  const [rows] = await pool.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
  if (rows.length === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Seeded default admin user: admin@example.com / admin123');
  }

  console.log('Database tables verified/created successfully.');
}

async function updateSchema() {
  try {
    const [userColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'whatsapp_number'");
    if (userColumns.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL");
      console.log("Added column 'whatsapp_number' to 'users' table.");
    }

    const [orderColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'cancel_reason'");
    if (orderColumns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN cancel_reason VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'cancel_reason' to 'orders' table.");
    }
  } catch (error) {
    console.error("Error updating database schema:", error.message);
  }
}

// Initialize on load
initDB();

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  getPool: () => pool
};
