const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 0,
  queueLimit: 0
};

let pool;

async function initDB() {
  try {
    const dbName = process.env.DB_NAME;

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
      discount_percent INT DEFAULT NULL,
      is_hot TINYINT DEFAULT 0,
      is_highlighted TINYINT DEFAULT 0,
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
  await pool.query(categoriesTable);
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
  await seedCategoriesAndProducts();
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

    const [additionalNotesCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'additional_notes'");
    if (additionalNotesCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN additional_notes TEXT DEFAULT NULL");
      console.log("Added column 'additional_notes' to 'orders' table.");
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
  } catch (error) {
    console.error("Error updating database schema:", error.message);
  }
}

async function seedCategoriesAndProducts() {
  try {
    const categories = [
      'Windows',
      'Microsoft Office',
      'Antivirus',
      'Creative Software',
      'Subscription',
      'Gift Card',
      'VPN',
      'AI Subscription'
    ];

    for (const cat of categories) {
      await pool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [cat]);
    }

    // Get categories with their IDs
    const [catRows] = await pool.query('SELECT * FROM categories');
    const catMap = {};
    catRows.forEach(row => {
      catMap[row.name] = row.id;
    });

    const productsToSeed = [
      {
        name: 'Office 365 Premium Subscription',
        description: 'Office 365 Premium Family/Personal account for 1 year with authentic Microsoft activation.',
        price: 950.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Office-365-Pro-Plus-min-600x600.webp',
        stock: 10,
        category_name: 'Microsoft Office',
        tags: 'Best Sellers, Office, Microsoft, Subscription',
        additional_info: 'Includes 1TB OneDrive cloud storage. Direct download from official Microsoft portal.',
        faqs: JSON.stringify([{ q: 'How many devices can I use?', a: 'Up to 5 devices simultaneously.' }]),
        packages: JSON.stringify([{ duration: '1 Year', price: '950' }]),
        device_options: 'Windows, Mac, Mobile',
        activation_options: 'Shared, Personal'
      },
      {
        name: 'Surfshark VPN 1 Year Subscription',
        description: 'Surfshark VPN Premium Subscription with unlimited devices, high-speed servers, and complete privacy.',
        price: 950.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Surfshark-VPN-min-600x600.webp',
        stock: 15,
        category_name: 'VPN',
        tags: 'Best Sellers, VPN, Privacy, Security',
        additional_info: 'Unlimited devices support. Strict no-logs policy.',
        faqs: JSON.stringify([{ q: 'Can I use it on Android TV?', a: 'Yes, Surfshark supports Android TV.' }]),
        packages: JSON.stringify([{ duration: '1 Year', price: '950' }]),
        device_options: 'All Devices',
        activation_options: 'Shared Account'
      },
      {
        name: 'Freepik Premium 1/12 Month',
        description: 'High-quality vectors, stock photos, PSD, and templates with Freepik Premium subscription.',
        price: 500.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Freepik-Premium-min-600x600.webp',
        stock: 0,
        category_name: 'Subscription',
        tags: 'Best Sellers, Graphic, Subscription, Designer',
        additional_info: 'Premium assets download limit: 100 per day.',
        faqs: JSON.stringify([{ q: 'Is it a personal email account?', a: 'No, this is a shared high-quality team access.' }]),
        packages: JSON.stringify([{ duration: '1 Month', price: '500' }, { duration: '12 Months', price: '9800' }]),
        device_options: 'Browser Only',
        activation_options: 'Shared Access'
      },
      {
        name: 'Windows 11 Pro Genuine Retail/OEM License Key',
        description: 'Windows 11 Pro Retail/OEM License activation key. Lifetime valid, fast digital delivery.',
        price: 799.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Windows-11-Pro-min-600x600.webp',
        stock: 20,
        category_name: 'Windows',
        tags: 'Best Sellers, Windows, Microsoft, OS',
        additional_info: 'Single PC lifetime license. Bindable key. Supports both 32-bit and 64-bit.',
        faqs: JSON.stringify([{ q: 'Is this upgradeable to future updates?', a: 'Yes, you will receive all official Microsoft updates.' }]),
        packages: JSON.stringify([{ duration: 'Lifetime', price: '799' }]),
        device_options: 'PC',
        activation_options: 'OEM, Retail'
      },
      {
        name: 'Windows 10 Pro Genuine Retail/OEM License Key',
        description: 'Windows 10 Pro Retail/OEM License activation key. Fast delivery, lifetime activation.',
        price: 699.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Windows-10-Pro-min-600x600.webp',
        stock: 25,
        category_name: 'Windows',
        tags: 'Best Sellers, Windows, Microsoft, OS',
        additional_info: 'OEM/Retail online activation key. Global activation.',
        faqs: JSON.stringify([{ q: 'Can I reactivate after reinstalling OS?', a: 'Yes, the key binds to your motherboard for digital activation.' }]),
        packages: JSON.stringify([{ duration: 'Lifetime', price: '699' }]),
        device_options: 'PC',
        activation_options: 'OEM, Retail'
      },
      {
        name: 'Autodesk Official Subscription',
        description: 'Autodesk AutoCAD / Maya / 3ds Max student or commercial official subscription access.',
        price: 300.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Autodesk-Official-Subscription-min-600x600.webp',
        stock: 12,
        category_name: 'Creative Software',
        tags: 'Creative, Autodesk, Engineering, Design',
        additional_info: 'Activates on your own email. 1-year warranty.',
        faqs: JSON.stringify([{ q: 'Is it official?', a: 'Yes, activated directly on Autodesk portal.' }]),
        packages: JSON.stringify([{ duration: '1 Year', price: '300' }]),
        device_options: 'PC, Mac',
        activation_options: 'Personal Email'
      },
      {
        name: 'Internet Download Manager (IDM) License Key',
        description: 'Internet Download Manager (IDM) 1-Year or Lifetime registration serial license key.',
        price: 244.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/IDM-min-600x600.webp',
        stock: 30,
        category_name: 'Windows',
        tags: 'Utility, Downloader, Windows',
        additional_info: '5x faster downloads. Integrates with all major browsers.',
        faqs: JSON.stringify([{ q: 'Is this lifetime?', a: 'We offer both 1-Year and Lifetime packages.' }]),
        packages: JSON.stringify([{ duration: '1 Year', price: '120' }, { duration: 'Lifetime', price: '244' }]),
        device_options: 'PC Only',
        activation_options: 'Personal Registration'
      },
      {
        name: 'Adobe Creative Cloud All Apps',
        description: 'Adobe Creative Cloud All Apps subscription. Photoshop, Premiere, Illustrator on your own email.',
        price: 244.00,
        image_url: 'https://www.digitalproductsbd.com/wp-content/uploads/Adobe-Creative-Cloud-min-600x600.webp',
        stock: 15,
        category_name: 'Creative Software',
        tags: 'Creative, Adobe, Design, Photoshop',
        additional_info: '100GB Cloud Storage included. Activates on your personal Adobe ID.',
        faqs: JSON.stringify([{ q: 'How many devices can I log in?', a: 'Up to 2 devices simultaneously.' }]),
        packages: JSON.stringify([{ duration: '1 Month', price: '120' }, { duration: '1 Year', price: '244' }]),
        device_options: 'PC, Mac, iPad',
        activation_options: 'Personal Account'
      }
    ];

    for (const prod of productsToSeed) {
      const categoryId = catMap[prod.category_name] || null;
      // Check if product already exists by name
      const [existing] = await pool.query('SELECT id FROM products WHERE name = ?', [prod.name]);
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO products (
            name, description, price, image_url, stock, category_id,
            tags, additional_info, faqs, packages, device_options, activation_options
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prod.name,
            prod.description,
            prod.price,
            prod.image_url,
            prod.stock,
            categoryId,
            prod.tags,
            prod.additional_info,
            prod.faqs,
            prod.packages,
            prod.device_options,
            prod.activation_options
          ]
        );
        console.log(`Seeded product: ${prod.name}`);
      }
    }
  } catch (error) {
    console.error('Error seeding database categories and products:', error);
  }
}

// Initialize on load
initDB();

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  getPool: () => pool
};
