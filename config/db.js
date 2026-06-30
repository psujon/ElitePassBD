const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const dbName = process.env.DB_NAME;

const pool = mysql.createPool({
  ...dbConfig,
  database: dbName
});

async function initDB() {
  try {

    // Try creating the database if privileges allow (mainly for local development)
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();
    } catch (dbCreateError) {
      console.log(`Note: Database auto-creation failed (${dbCreateError.message}). Attempting direct connection...`);
    }

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

  const categoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
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
      category_id INT DEFAULT NULL,
      tags TEXT DEFAULT NULL,
      additional_info TEXT DEFAULT NULL,
      faqs TEXT DEFAULT NULL,
      packages TEXT DEFAULT NULL,
      device_options TEXT DEFAULT NULL,
      activation_options TEXT DEFAULT NULL,
      activation_process VARCHAR(50) DEFAULT 'Manual',
      discount_percent INT DEFAULT NULL,
      is_hot TINYINT DEFAULT 0,
      is_highlighted TINYINT DEFAULT 0,
      is_hot_discount TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
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
      delivery_email VARCHAR(255) DEFAULT NULL,
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

  const epsPaymentHistoryTable = `
    CREATE TABLE IF NOT EXISTS eps_payment_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      merchant_transaction_id VARCHAR(255) NOT NULL,
      eps_transaction_id VARCHAR(255) DEFAULT NULL,
      order_id INT DEFAULT NULL,
      amount DECIMAL(10, 2) DEFAULT NULL,
      status VARCHAR(50) DEFAULT NULL,
      raw_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const passwordResetsTable = `
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const productLicensesTable = `
    CREATE TABLE IF NOT EXISTS product_licenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      activation_option VARCHAR(255) DEFAULT NULL,
      package_option VARCHAR(255) DEFAULT NULL,
      license_key VARCHAR(255) NOT NULL,
      is_used TINYINT DEFAULT 0,
      order_item_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
    );
  `;

  const slidesTable = `
    CREATE TABLE IF NOT EXISTS slides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(usersTable);
  await pool.query(categoriesTable);
  await pool.query(productsTable);
  await pool.query(ordersTable);
  await pool.query(orderItemsTable);
  await pool.query(reviewsTable);
  await pool.query(supportTicketsTable);
  await pool.query(epsPaymentHistoryTable);
  await pool.query(passwordResetsTable);
  await pool.query(productLicensesTable);
  await pool.query(slidesTable);

  // Seed default admin if not exists
  // const [rows] = await pool.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
  // if (rows.length === 0) {
  //   const bcrypt = require('bcryptjs');
  //   const hashedPassword = await bcrypt.hash('admin123', 10);
  //   await pool.query(
  //     'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
  //     ['Admin User', 'admin@example.com', hashedPassword, 'admin']
  //   );
  //   console.log('Seeded default admin user');
  // }

  console.log('Database tables verified/created successfully.');
}

async function updateSchema() {
  try {
    const [transCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'transaction_id'");
    if (transCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'transaction_id' to 'orders' table.");
    }

    const [payStatusCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'payment_status'");
    if (payStatusCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('Pending', 'Paid', 'Failed', 'Cancelled') DEFAULT 'Pending'");
      console.log("Added column 'payment_status' to 'orders' table.");
    }

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

    const [additionalNotesCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'additional_notes'");
    if (additionalNotesCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN additional_notes TEXT DEFAULT NULL");
      console.log("Added column 'additional_notes' to 'orders' table.");
    }

    const [deliveryEmailCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'delivery_email'");
    if (deliveryEmailCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN delivery_email VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'delivery_email' to 'orders' table.");
    }

    const [prodColumns] = await pool.query("SHOW COLUMNS FROM products LIKE 'category_id'");
    if (prodColumns.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query("ALTER TABLE products ADD COLUMN category_id INT DEFAULT NULL");
      await pool.query("ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL");
      console.log("Added column 'category_id' to 'products' table.");
    }

    // New Columns for Product Configurations
    const [tagsCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'tags'");
    if (tagsCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN tags TEXT DEFAULT NULL");
      console.log("Added column 'tags' to 'products' table.");
    }

    const [addInfoCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'additional_info'");
    if (addInfoCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN additional_info TEXT DEFAULT NULL");
      console.log("Added column 'additional_info' to 'products' table.");
    }

    const [faqsCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'faqs'");
    if (faqsCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN faqs TEXT DEFAULT NULL");
      console.log("Added column 'faqs' to 'products' table.");
    }

    const [packagesCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'packages'");
    if (packagesCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN packages TEXT DEFAULT NULL");
      console.log("Added column 'packages' to 'products' table.");
    }

    const [deviceOptsCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'device_options'");
    if (deviceOptsCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN device_options TEXT DEFAULT NULL");
      console.log("Added column 'device_options' to 'products' table.");
    }

    const [actOptsCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'activation_options'");
    if (actOptsCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN activation_options TEXT DEFAULT NULL");
      console.log("Added column 'activation_options' to 'products' table.");
    }

    // New Columns for Order Item Selections
    const [packageNameCols] = await pool.query("SHOW COLUMNS FROM order_items LIKE 'package_name'");
    if (packageNameCols.length === 0) {
      await pool.query("ALTER TABLE order_items ADD COLUMN package_name VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'package_name' to 'order_items' table.");
    }

    const [selectedDeviceCols] = await pool.query("SHOW COLUMNS FROM order_items LIKE 'selected_device'");
    if (selectedDeviceCols.length === 0) {
      await pool.query("ALTER TABLE order_items ADD COLUMN selected_device VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'selected_device' to 'order_items' table.");
    }

    const [selectedActivationCols] = await pool.query("SHOW COLUMNS FROM order_items LIKE 'selected_activation'");
    if (selectedActivationCols.length === 0) {
      await pool.query("ALTER TABLE order_items ADD COLUMN selected_activation VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'selected_activation' to 'order_items' table.");
    }

    const [discountCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'discount_percent'");
    if (discountCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN discount_percent INT DEFAULT NULL");
      console.log("Added column 'discount_percent' to 'products' table.");
    }

    const [isHotCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_hot'");
    if (isHotCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_hot TINYINT DEFAULT 0");
      console.log("Added column 'is_hot' to 'products' table.");
    }

    const [isHighlightedCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_highlighted'");
    if (isHighlightedCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_highlighted TINYINT DEFAULT 0");
      console.log("Added column 'is_highlighted' to 'products' table.");
    }

    const [activationProcessCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'activation_process'");
    if (activationProcessCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN activation_process VARCHAR(50) DEFAULT 'Manual'");
      console.log("Added column 'activation_process' to 'products' table.");
    }

    const [isHotDiscountCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_hot_discount'");
    if (isHotDiscountCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_hot_discount TINYINT DEFAULT 0");
      console.log("Added column 'is_hot_discount' to 'products' table.");
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
