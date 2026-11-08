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
  queueLimit: 0,
  charset: 'utf8mb4'
};

const dbName = process.env.DB_NAME;

const pool = mysql.createPool({
  ...dbConfig,
  database: dbName
});

async function initDB() {
  try {

    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();
    } catch (dbCreateError) {
      console.log(`Note: Database auto-creation failed (${dbCreateError.message}). Attempting direct connection...`);
    }

    console.log(`Connected to MySQL database: ${dbName}`);
    await createTables();

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
      address TEXT DEFAULT NULL,
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
      discount_percent DECIMAL(10, 2) DEFAULT NULL,
      is_hot TINYINT DEFAULT 0,
      is_highlighted TINYINT DEFAULT 0,
      is_hot_discount TINYINT DEFAULT 0,
      highlighted_text TEXT DEFAULT NULL,
      is_deleted TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `;

  const ordersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      customer_name VARCHAR(255) DEFAULT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
      cancel_reason VARCHAR(255) DEFAULT NULL,
      delivery_email VARCHAR(255) DEFAULT NULL,
      client_ip VARCHAR(255) DEFAULT NULL,
      client_user_agent TEXT DEFAULT NULL,
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
      rules TEXT DEFAULT NULL,
      license_key TEXT NOT NULL,
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

  const siteSettingsTable = `
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value LONGTEXT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const couponsTable = `
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
      discount_value DECIMAL(10, 2) NOT NULL,
      min_order_amount DECIMAL(10, 2) DEFAULT 0,
      max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
      usage_limit INT DEFAULT NULL,
      used_count INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      expires_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const subscriptionsTable = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      whatsapp_number VARCHAR(100) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      product_name VARCHAR(255) NOT NULL,
      package_plan VARCHAR(255) NOT NULL,
      customer_source ENUM('Website', 'WhatsApp', 'Facebook', 'Manual') DEFAULT 'Manual',
      purchase_date DATE NOT NULL,
      validity_days INT NOT NULL,
      expiry_date DATE NOT NULL,
      account_given TEXT DEFAULT NULL,
      selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      payment_status ENUM('Paid', 'Pending', 'Failed') DEFAULT 'Paid',
      notes TEXT DEFAULT NULL,
      customer_notes TEXT DEFAULT NULL,
      admin_notes TEXT DEFAULT NULL,
      order_id INT DEFAULT NULL,
      vendor_id INT DEFAULT NULL,
      vendor_price DECIMAL(10, 2) DEFAULT 0.00,
      digital_account_id INT DEFAULT NULL,
      digital_slot_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );
  `;

  const subscriptionRenewalsTable = `
    CREATE TABLE IF NOT EXISTS subscription_renewals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subscription_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      validity_days INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('Current', 'Previous') DEFAULT 'Current',
      notes TEXT DEFAULT NULL,
      customer_notes TEXT DEFAULT NULL,
      admin_notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );
  `;

  const subscriptionRemindersTable = `
    CREATE TABLE IF NOT EXISTS subscription_reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subscription_id INT NOT NULL,
      reminder_type ENUM('3_DAYS_BEFORE', '1_DAY_BEFORE', 'EXPIRY_DAY') NOT NULL,
      channel ENUM('WhatsApp', 'Email', 'AdminAlert') NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      status ENUM('Sent', 'Failed') DEFAULT 'Sent',
      failure_reason TEXT DEFAULT NULL,
      scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );
  `;

  const subscriptionSettingsTable = `
    CREATE TABLE IF NOT EXISTS subscription_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value LONGTEXT DEFAULT NULL
    );
  `;

  const subscriptionNoteTemplatesTable = `
    CREATE TABLE IF NOT EXISTS subscription_note_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const vendorsTable = `
    CREATE TABLE IF NOT EXISTS vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) DEFAULT NULL,
      website VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      whatsapp VARCHAR(100) DEFAULT NULL,
      telegram VARCHAR(100) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      payment_details TEXT DEFAULT NULL,
      category VARCHAR(100) DEFAULT 'General',
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      balance DECIMAL(10, 2) DEFAULT 0.00,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  await pool.query(siteSettingsTable);
  await pool.query(couponsTable);
  await pool.query(subscriptionsTable);
  await pool.query(subscriptionRenewalsTable);
  await pool.query(subscriptionRemindersTable);
  await pool.query(subscriptionSettingsTable);
  await pool.query(subscriptionNoteTemplatesTable);
  await pool.query(vendorsTable);

  const defaultMarqueeItems = [
    {
      id: '1',
      badge: 'বিশেষ অফার',
      text: 'সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান',
      badgeColor: 'purple',
      textColor: 'violet'
    },
    {
      id: '2',
      badge: '🛡️ 100% Genuine',
      text: 'Genuine Digital License & Instant Email Delivery',
      badgeColor: 'emerald',
      textColor: 'emerald'
    },
    {
      id: '3',
      badge: '⭐ 50,000+',
      text: 'Trusted by Happy Customers in Bangladesh',
      badgeColor: 'amber',
      textColor: 'amber'
    }
  ];

  await pool.query(`
    INSERT IGNORE INTO site_settings (setting_key, setting_value)
    VALUES 
      ('marquee_enabled', 'true'),
      ('marquee_speed', '35'),
      ('marquee_items', ?),
      ('support_whatsapp', '8801925112444'),
      ('support_email', 'info@elitepassbd.com'),
      ('social_facebook', 'https://facebook.com/ElitePassBD'),
      ('social_instagram', 'https://instagram.com/elitepassbd'),
      ('social_youtube', 'https://youtube.com/elitepassbd'),
      ('social_linkedin', 'https://linkedin.com/elitepassbd'),
      ('social_messenger', 'https://m.me/elitepassbd')
  `, [JSON.stringify(defaultMarqueeItems)]);

  await pool.query(`
    INSERT IGNORE INTO subscription_settings (setting_key, setting_value)
    VALUES 
      ('reminder_3_days_before', 'true'),
      ('reminder_1_day_before', 'true'),
      ('reminder_expiry_day', 'true'),
      ('channel_whatsapp_enabled', 'true'),
      ('channel_email_enabled', 'true'),
      ('whatsapp_cloud_api_token', ''),
      ('whatsapp_phone_number_id', ''),
      ('whatsapp_template', 'Hello {customer_name}, your {product_name} subscription expires on {expiry_date}. Please complete renewal payment to continue. Thank you, ElitePassBD.'),
      ('email_subject_template', 'Your {product_name} Subscription is Expiring'),
      ('email_body_template', 'Hello {customer_name},\\n\\nYour {product_name} subscription ({package_plan}) is set to expire on {expiry_date}.\\n\\nTo keep your access uninterrupted, please complete your renewal payment.\\n\\nThank you,\\nElitePassBD'),
      ('admin_alert_dashboard', 'true'),
      ('admin_alert_email', 'true'),
      ('admin_alert_whatsapp', 'true'),
      ('admin_email', 'admin@elitepassbd.com'),
      ('admin_whatsapp', '')
  `);

  try {
    const [existingNoteTpls] = await pool.query('SELECT COUNT(*) as cnt FROM subscription_note_templates');
    if (existingNoteTpls && existingNoteTpls[0] && existingNoteTpls[0].cnt === 0) {
      const defaultTemplates = [
        [
          'লগইন ও ব্যবহার সংক্রান্ত নির্দেশনা (Login Guide)',
          'আপনার সাবস্ক্রিপশনটি সক্রিয় করা হয়েছে। অনুগ্রহ করে আপনাকে প্রদত্ত ক্রেডেনশিয়াল (ইমেইল/পাসওয়ার্ড/লাইসেন্স) দিয়ে লগইন করুন। কোনো সমস্যা হলে আমাদের হোয়াটসঅ্যাপে সাথে সাথে যোগাযোগ করুন।'
        ],
        [
          'পাসওয়ার্ড ও ইমেইল পরিবর্তন না করার সতর্কবার্তা (Do Not Change Email/Pass)',
          'বিশেষ সতর্কবার্তা: অনুগ্রহ করে একাউন্টের পাসওয়ার্ড, ইমেইল, প্রোফাইল নাম বা কোনো সিকিউরিটি সেটিংস পরিবর্তন করবেন না। কোনো পরিবর্তন করা হলে ওয়ারেন্টি ও সার্ভিস বাতিল বলে গণ্য হবে।'
        ],
        [
          'শেয়ার্ড একাউন্ট ব্যবহারের নিয়মাবলী (Single Device / Shared Rules)',
          'এই একাউন্টটি শুধুমাত্র ১টি ডিভাইসে লগইন করে ব্যবহারের জন্য প্রযোজ্য। একই সাথে একাধিক ডিভাইসে লগইন বা ক্রেডেনশিয়াল অন্য কারো সাথে শেয়ার করা সম্পূর্ণ নিষিদ্ধ।'
        ],
        [
          'ওয়ারেন্টি ও টেকনিক্যাল সাপোর্ট (Warranty & Support Policy)',
          'সাবস্ক্রিপশনের সম্পূর্ণ মেয়াদজুড়ে আপনি আমাদের টেকনিক্যাল সাপোর্ট পাবেন। যেকোনো জটিলতায় আপনার অর্ডার নাম্বার উল্লেখ করে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ, ElitePassBD।'
        ],
        [
          'রিনিউয়াল সংক্রান্ত নোটিশ ও নির্দেশনা (Renewal Notice)',
          'আপনার সাবস্ক্রিপশন সফলভাবে রিনিউ করা হয়েছে এবং মেয়াদ বৃদ্ধি করা হয়েছে। নির্বিঘ্নে ব্যবহারের শুভকামনা রইল। যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিম পাশে আছে।'
        ]
      ];
      for (const [title, content] of defaultTemplates) {
        await pool.query('INSERT INTO subscription_note_templates (title, content) VALUES (?, ?)', [title, content]);
      }
    }
  } catch (seedErr) {
    console.warn('[config/db.js] Error seeding note templates:', seedErr.message);
  }

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

    const [custNameCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'customer_name'");
    if (custNameCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL AFTER user_id");
      console.log("Added column 'customer_name' to 'orders' table.");
    }

    const [deliveryEmailCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'delivery_email'");
    if (deliveryEmailCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN delivery_email VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'delivery_email' to 'orders' table.");
    }

    const [clientIpCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'client_ip'");
    if (clientIpCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN client_ip VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'client_ip' to 'orders' table.");
    }

    const [clientUaCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'client_user_agent'");
    if (clientUaCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN client_user_agent TEXT DEFAULT NULL");
      console.log("Added column 'client_user_agent' to 'orders' table.");
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
      await pool.query("ALTER TABLE order_items ADD COLUMN selected_activation TEXT DEFAULT NULL");
      console.log("Added column 'selected_activation' to 'order_items' table.");
    } else {
      try {
        await pool.query("ALTER TABLE order_items MODIFY COLUMN selected_activation TEXT DEFAULT NULL");
      } catch (modActErr) {
        // ignore
      }
    }

    const [discountCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'discount_percent'");
    if (discountCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN discount_percent DECIMAL(10, 2) DEFAULT NULL");
      console.log("Added column 'discount_percent' to 'products' table.");
    } else {
      await pool.query("ALTER TABLE products MODIFY COLUMN discount_percent DECIMAL(10, 2) DEFAULT NULL");
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

    const [highlightedTextCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'highlighted_text'");
    if (highlightedTextCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN highlighted_text TEXT DEFAULT NULL");
      console.log("Added column 'highlighted_text' to 'products' table.");
    }

    const [isInstantCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_instant'");
    if (isInstantCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_instant TINYINT DEFAULT 0");
      console.log("Added column 'is_instant' to 'products' table.");
    }

    const [topSellingCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_top_selling'");
    if (topSellingCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_top_selling TINYINT DEFAULT 0");
      console.log("Added column 'is_top_selling' to 'products' table.");
    }

    const [bulletPointsCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'bullet_points'");
    if (bulletPointsCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN bullet_points TEXT DEFAULT NULL");
      console.log("Added column 'bullet_points' to 'products' table.");
    }

    const [isDeletedCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'is_deleted'");
    if (isDeletedCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN is_deleted TINYINT DEFAULT 0");
      console.log("Added column 'is_deleted' to 'products' table.");
    }

    const [addressCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'address'");
    if (addressCols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL");
      console.log("Added column 'address' to 'users' table.");
    }

    const [avatarCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'avatar'");
    if (avatarCols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN avatar LONGTEXT DEFAULT NULL");
      console.log("Added column 'avatar' to 'users' table.");
    }

    const [rulesCols] = await pool.query("SHOW COLUMNS FROM product_licenses LIKE 'rules'");
    if (rulesCols.length === 0) {
      await pool.query("ALTER TABLE product_licenses ADD COLUMN rules LONGTEXT DEFAULT NULL");
      console.log("Added column 'rules' to 'product_licenses' table.");
    }

    const [usedAtCols] = await pool.query("SHOW COLUMNS FROM product_licenses LIKE 'used_at'");
    if (usedAtCols.length === 0) {
      await pool.query("ALTER TABLE product_licenses ADD COLUMN used_at DATETIME DEFAULT NULL");
      console.log("Added column 'used_at' to 'product_licenses' table.");
    }

    try {
      await pool.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } catch (dbCharsetErr) {
      // Shared hosting / cPanel users often don't have ALTER DATABASE permissions; safely ignore
    }

    try {
      await pool.query("ALTER TABLE product_licenses CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (tblConvertErr) {
      // Ignore if foreign key constraint restricts table-level convert
    }

    const utf8mb4Queries = [
      "ALTER TABLE product_licenses MODIFY COLUMN rules LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE product_licenses MODIFY COLUMN license_key LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL",
      "ALTER TABLE product_licenses MODIFY COLUMN activation_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE product_licenses MODIFY COLUMN package_option TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE products MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL",
      "ALTER TABLE products MODIFY COLUMN description LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL",
      "ALTER TABLE products MODIFY COLUMN additional_info LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE products MODIFY COLUMN faqs LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE products MODIFY COLUMN packages LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE products MODIFY COLUMN bullet_points LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL",
      "ALTER TABLE products MODIFY COLUMN highlighted_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL"
    ];

    for (const q of utf8mb4Queries) {
      try {
        await pool.query(q);
      } catch (colErr) {
        // Individual column alter error log
      }
    }
    console.log("Verified product_licenses and products columns charset utf8mb4_unicode_ci.");

    const [revNameCols] = await pool.query("SHOW COLUMNS FROM reviews LIKE 'reviewer_name'");
    if (revNameCols.length === 0) {
      await pool.query("ALTER TABLE reviews ADD COLUMN reviewer_name VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'reviewer_name' to 'reviews' table.");
    }

    const [revEmailCols] = await pool.query("SHOW COLUMNS FROM reviews LIKE 'reviewer_email'");
    if (revEmailCols.length === 0) {
      await pool.query("ALTER TABLE reviews ADD COLUMN reviewer_email VARCHAR(255) DEFAULT NULL");
      console.log("Added column 'reviewer_email' to 'reviews' table.");
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
          discount_value DECIMAL(10, 2) NOT NULL,
          min_order_amount DECIMAL(10, 2) DEFAULT 0,
          max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
          usage_limit INT DEFAULT NULL,
          used_count INT DEFAULT 0,
          is_active TINYINT DEFAULT 1,
          expires_at DATETIME DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Coupons table verified/created.");
    } catch (err) {
      console.error("Error creating coupons table:", err.message);
    }

    const [couponCodeCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'coupon_code'");
    if (couponCodeCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL");
      await pool.query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0");
      console.log("Added coupon_code and discount_amount columns to orders table.");
    }

    const [reviewEmailSentCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'review_email_sent'");
    if (reviewEmailSentCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN review_email_sent TINYINT DEFAULT 0");
      console.log("Added column 'review_email_sent' to 'orders' table.");
    }

    const [purchaseEmailSentCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'purchase_email_sent'");
    if (purchaseEmailSentCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN purchase_email_sent TINYINT DEFAULT 0");
      console.log("Added column 'purchase_email_sent' to 'orders' table.");
    }

    const [licenseEmailSentCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'license_email_sent'");
    if (licenseEmailSentCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN license_email_sent TINYINT DEFAULT 0");
      console.log("Added column 'license_email_sent' to 'orders' table.");
    }

    const [completedAtCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'completed_at'");
    if (completedAtCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL");
      console.log("Added column 'completed_at' to 'orders' table.");
    }

    try {
      await pool.query("ALTER TABLE reviews MODIFY user_id INT DEFAULT NULL");
    } catch (err) {
    }

    try {
      await pool.query("ALTER TABLE reviews DROP INDEX unique_user_product");
    } catch (err) {
    }

    // Performance indexes for subscriptions and product_licenses
    try {
      const [licIdx] = await pool.query("SHOW INDEX FROM product_licenses WHERE Key_name = 'idx_product_is_used'");
      if (licIdx.length === 0) {
        await pool.query("CREATE INDEX idx_product_is_used ON product_licenses (product_id, is_used)");
        console.log("Created index 'idx_product_is_used' on 'product_licenses' table.");
      }
    } catch (e) {}

    try {
      const [subStatusIdx] = await pool.query("SHOW INDEX FROM subscriptions WHERE Key_name = 'idx_sub_status_expiry'");
      if (subStatusIdx.length === 0) {
        await pool.query("CREATE INDEX idx_sub_status_expiry ON subscriptions (status, expiry_date)");
        console.log("Created index 'idx_sub_status_expiry' on 'subscriptions' table.");
      }
    } catch (e) {}

    try {
      const [subPhoneIdx] = await pool.query("SHOW INDEX FROM subscriptions WHERE Key_name = 'idx_sub_phone'");
      if (subPhoneIdx.length === 0) {
        await pool.query("CREATE INDEX idx_sub_phone ON subscriptions (whatsapp_number)");
        console.log("Created index 'idx_sub_phone' on 'subscriptions' table.");
      }
    } catch (e) {}

    try {
      await pool.query("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled', 'Not Renewed') DEFAULT 'Active'");
    } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vendors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) DEFAULT NULL,
          phone VARCHAR(50) DEFAULT NULL,
          whatsapp VARCHAR(100) DEFAULT NULL,
          telegram VARCHAR(100) DEFAULT NULL,
          email VARCHAR(255) DEFAULT NULL,
          address TEXT DEFAULT NULL,
          payment_details TEXT DEFAULT NULL,
          category VARCHAR(100) DEFAULT 'General',
          status ENUM('Active', 'Inactive') DEFAULT 'Active',
          balance DECIMAL(10, 2) DEFAULT 0.00,
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("Vendors table verified/created.");

      const [tgCols] = await pool.query("SHOW COLUMNS FROM vendors LIKE 'telegram'");
      if (tgCols.length === 0) {
        await pool.query("ALTER TABLE vendors ADD COLUMN telegram VARCHAR(100) DEFAULT NULL AFTER whatsapp");
        console.log("Added column 'telegram' to 'vendors' table.");
      }

      const [webCols] = await pool.query("SHOW COLUMNS FROM vendors LIKE 'website'");
      if (webCols.length === 0) {
        await pool.query("ALTER TABLE vendors ADD COLUMN website VARCHAR(255) DEFAULT NULL AFTER company_name");
        console.log("Added column 'website' to 'vendors' table.");
      }
    } catch (err) {
      console.error("Error creating vendors table:", err.message);
    }

    try {
      const [vIdCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'vendor_id'");
      if (vIdCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN vendor_id INT DEFAULT NULL AFTER order_id");
        console.log("Added column 'vendor_id' to 'subscriptions' table.");
      }

      const [vPriceCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'vendor_price'");
      if (vPriceCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN vendor_price DECIMAL(10, 2) DEFAULT 0.00 AFTER vendor_id");
        console.log("Added column 'vendor_price' to 'subscriptions' table.");
      }

      const [digAccCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'digital_account_id'");
      if (digAccCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN digital_account_id INT DEFAULT NULL AFTER vendor_price");
        console.log("Added column 'digital_account_id' to 'subscriptions' table.");
      }

      const [digSlotCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'digital_slot_id'");
      if (digSlotCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN digital_slot_id INT DEFAULT NULL AFTER digital_account_id");
        console.log("Added column 'digital_slot_id' to 'subscriptions' table.");
      }

      const [digAccIdx] = await pool.query("SHOW INDEX FROM subscriptions WHERE Key_name = 'idx_sub_digital_acc'");
      if (digAccIdx.length === 0) {
        await pool.query("CREATE INDEX idx_sub_digital_acc ON subscriptions (digital_account_id)");
        console.log("Created index 'idx_sub_digital_acc' on 'subscriptions' table.");
      }

      const [custNotesCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'customer_notes'");
      if (custNotesCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN customer_notes TEXT DEFAULT NULL AFTER notes");
        console.log("Added column 'customer_notes' to 'subscriptions' table.");
      }

      const [adminNotesCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'admin_notes'");
      if (adminNotesCols.length === 0) {
        await pool.query("ALTER TABLE subscriptions ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER customer_notes");
        console.log("Added column 'admin_notes' to 'subscriptions' table.");
      }

      const [renCustCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'customer_notes'");
      if (renCustCols.length === 0) {
        await pool.query("ALTER TABLE subscription_renewals ADD COLUMN customer_notes TEXT DEFAULT NULL AFTER notes");
        console.log("Added column 'customer_notes' to 'subscription_renewals' table.");
      }

      const [renAdminCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'admin_notes'");
      if (renAdminCols.length === 0) {
        await pool.query("ALTER TABLE subscription_renewals ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER customer_notes");
        console.log("Added column 'admin_notes' to 'subscription_renewals' table.");
      }

      const [renAccCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'account_given'");
      if (renAccCols.length === 0) {
        await pool.query("ALTER TABLE subscription_renewals ADD COLUMN account_given LONGTEXT DEFAULT NULL AFTER amount");
        console.log("Added column 'account_given' to 'subscription_renewals' table.");
      }
    } catch (subColErr) {
      console.error("Error ensuring extra columns on subscriptions/renewals:", subColErr.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS digital_license_accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT DEFAULT NULL,
          product_name VARCHAR(255) NOT NULL,
          account_email VARCHAR(255) NOT NULL,
          account_password VARCHAR(255) DEFAULT '',
          recovery_email VARCHAR(255) DEFAULT NULL,
          two_factor_status ENUM('Enabled', 'Disabled') DEFAULT 'Enabled',
          two_factor_key TEXT DEFAULT NULL,
          total_slots INT NOT NULL DEFAULT 5,
          status ENUM('Active', 'Expiring', 'Expired', 'Inactive') DEFAULT 'Active',
          expiry_date DATE DEFAULT NULL,
          vendor_id INT DEFAULT NULL,
          vendor_name VARCHAR(255) DEFAULT NULL,
          purchased_date DATE DEFAULT NULL,
          renewal_date DATE DEFAULT NULL,
          purchase_price DECIMAL(10, 2) DEFAULT 0.00,
          renewal_cost DECIMAL(10, 2) DEFAULT 0.00,
          payment_method VARCHAR(50) DEFAULT 'bKash',
          invoice_no VARCHAR(100) DEFAULT NULL,
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_dla_product (product_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS digital_license_slots (
          id INT AUTO_INCREMENT PRIMARY KEY,
          account_id INT NOT NULL,
          slot_number INT NOT NULL,
          order_id INT DEFAULT NULL,
          assigned_to VARCHAR(255) DEFAULT NULL,
          customer_name VARCHAR(255) DEFAULT NULL,
          customer_phone VARCHAR(50) DEFAULT NULL,
          start_date DATE DEFAULT NULL,
          end_date DATE DEFAULT NULL,
          status ENUM('Active', 'Available', 'Expired', 'Suspended') DEFAULT 'Available',
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES digital_license_accounts(id) ON DELETE CASCADE,
          INDEX idx_dls_account_slot (account_id, slot_number),
          INDEX idx_dls_order (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const [orderIdCols] = await pool.query("SHOW COLUMNS FROM digital_license_slots LIKE 'order_id'");
      if (orderIdCols.length === 0) {
        await pool.query("ALTER TABLE digital_license_slots ADD COLUMN order_id INT DEFAULT NULL AFTER slot_number");
        console.log("Added column 'order_id' to 'digital_license_slots' table.");
      }

      try {
        await pool.query("ALTER TABLE digital_license_accounts MODIFY COLUMN account_password VARCHAR(255) DEFAULT ''");
      } catch (alterPassErr) {
        // Ignore if error
      }
    } catch (digLicenseErr) {
      console.error("Error ensuring digital license tables in schema:", digLicenseErr.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_usage_rules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          title VARCHAR(255) NOT NULL DEFAULT 'Standard Usage Rules',
          rules_text LONGTEXT NOT NULL,
          is_active TINYINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_pur_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log("Product usage rules table verified/created.");
    } catch (ruleTableErr) {
      console.error("Error ensuring product_usage_rules table:", ruleTableErr.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS page_sections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          page_key VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content LONGTEXT NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active TINYINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ps_page_key (page_key),
          INDEX idx_ps_sort_order (sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log("Page sections table verified/created.");

      // Seed initial default content if table is empty
      const [existingCount] = await pool.query("SELECT COUNT(*) AS total FROM page_sections");
      if (existingCount[0].total === 0) {
        console.log("Seeding default page sections...");
        const seedData = [
          // About Us
          ['about', 'আমাদের লক্ষ্য ও উদ্দেশ্য', '<p><strong>ElitePassBD</strong>-তে আমরা বিশ্বাস করি, প্রত্যেকেরই প্রিমিয়াম ডিজিটাল বিনোদন এবং প্রয়োজনীয় সফটওয়্যার টুলসে নির্বিঘ্ন, নিরাপদ এবং তাৎক্ষণিক অ্যাক্সেস পাওয়ার অধিকার রয়েছে। আপনি কাজের জন্য এআই টুলস (ChatGPT, Gemini), স্ট্রিমিং ও বিনোদন, অফিস প্রোডাক্টিভিটি সফটওয়্যার, কিংবা গেমিং পাস যা-ই খুঁজছেন না কেন—আমরা আপনার বিশ্বস্ত দেশীয় সমাধানদাতা।</p><p>বাংলাদেশে আন্তর্জাতিক পেমেন্ট কার্ড না থাকার কারণে ডিজিটাল সেবা কেনায় যে জটিলতা তৈরি হতো, তা দূর করতেই আমাদের এই উদ্যোগ। আমরা বিকাশ ও নগদের মতো সহজ দেশীয় পেমেন্ট মাধ্যমে দ্রুততম সময়ে আসল এবং ভেরিফায়েড লাইসেন্স ও সাবস্ক্রিপশন সরবরাহ করে থাকি।</p>', 1, 1],
          ['about', 'অতি দ্রুত ডেলিভারি (Instant Delivery)', '<p>আপনার মূল্যবান সময়ের গুরুত্ব আমরা বুঝি। পেমেন্ট ভেরিফিকেশনের পর লাইসেন্স কোড বা অ্যাক্টিভেশন নির্দেশনা সরাসরি আপনার হোয়াটসঅ্যাপ অথবা ইমেইলে দ্রুততম সময়ে পৌঁছে দেওয়া হয়।</p>', 2, 1],
          ['about', 'নিরাপদ লেনদেন (100% Secure)', '<p>সম্পূর্ণ নিশ্চিন্তে কেনাকাটা করুন। আমাদের সকল লেনদেন অত্যন্ত সতর্কতার সাথে সুরক্ষিতভাবে পরিচালিত হয় এবং আপনার ব্যক্তিগত তথ্যের সম্পূর্ণ গোপনীয়তা বজায় রাখা হয়।</p>', 3, 1],
          ['about', 'প্রিমিয়াম মান ও আসল লাইসেন্স', '<p>আমরা সরাসরি অফিসিয়াল সোর্স ও ভেরিফায়েড পার্টনারদের থেকে ডিজিটাল কোড ও সাবস্ক্রিপশন সংগ্রহ করি, যা প্রতিটি প্রোডাক্টে নির্দিষ্ট মেয়াদের ওয়ারেন্টি নিশ্চয়তা দেয়।</p>', 4, 1],
          ['about', 'ডেডিকেটেড কাস্টমার সাপোর্ট', '<p>লাইসেন্স অ্যাক্টিভেশন বা পণ্য সম্পর্কিত যেকোনো প্রশ্ন বা সমস্যায় আমাদের সাপোর্ট টিম এবং হোয়াটসঅ্যাপ হেল্পলাইন সবসময় আপনাকে আন্তরিক সেবা দিতে প্রস্তুত।</p>', 5, 1],
          ['about', 'কেন আমাদের বেছে নেবেন?', '<p>সহজ ও সুবিধাজনক বিকাশ/নগদ পেমেন্ট সুবিধা। ১০০% কার্যকর ও মেয়াদের নিশ্চয়তাসহ লাইসেন্স। অর্ডার ট্র্যাকিং ও দ্রুত ডেলিভারি নোটিফিকেশন। সমস্যায় তাৎক্ষণিক রিপ্লেসমেন্ট ও সাপোর্ট সহায়তা।</p>', 6, 1],

          // Our Partners
          ['partners', 'পার্টনারশিপের মাধ্যমে প্রিমিয়াম সেবার নিশ্চয়তা', '<p><strong>ElitePassBD</strong> শুধুমাত্র শীর্ষস্থানীয় আন্তর্জাতিক ডিজিটাল সোর্স এবং ভেরিফায়েড গ্লোবাল ডিস্ট্রিবিউটরদের সাথে অংশীদারিত্বের মাধ্যমে কাজ করে। এর মাধ্যমে আমরা নিশ্চিত করি যে আমাদের গ্রাহকরা পাচ্ছেন ১০০% আসল, বৈধ এবং মেয়াদের পূর্ণ নিশ্চয়তাযুক্ত ডিজিটাল কি ও প্রিমিয়াম সাবস্ক্রিপশন।</p><p>আমরা স্থানীয় পেমেন্ট গেটওয়ে প্রোভাইডার এবং নির্ভরযোগ্য ভেন্ডরদের সাথে নিয়মিত সমন্বয় করে বাংলাদেশের ব্যবহারকারীদের জন্য ডিজিটাল কেনাকাটাকে সহজ, নিরাপদ এবং দ্রুততর করে তুলছি।</p>', 1, 1],
          ['partners', 'গ্লোবাল ডিজিটাল সার্ভিসেস', '<p>বিশ্বখ্যাত ডিজিটাল প্ল্যাটফর্ম যেমন Microsoft 365, Google Workspace, OpenAI (ChatGPT Plus), Canva Pro, Spotify এবং অন্যান্য শীর্ষ ব্র্যান্ডের জেনুইন অ্যাক্টিভেশন সোর্সিং। অফিসিয়াল ডিস্ট্রিবিউশন চ্যানেল এবং পূর্ণ মেয়াদের সক্রিয় ওয়ারেন্টি সুবিধা।</p>', 2, 1],
          ['partners', 'বিশ্বস্ত পেমেন্ট পার্টনার্স', '<p>বাংলাদেশের সবচেয়ে জনপ্রিয় মোবাইল ফিনান্সিয়াল সার্ভিসেস (bKash, Nagad, Rocket) ও লোকাল ব্যাংকিং ব্যবস্থার সাথে নিরাপদ ইন্টিগ্রেশন ও ম্যানুয়াল ভেরিফিকেশন ব্যবস্থা। তাত্ক্ষণিক ট্রানজেকশন ট্র্যাকিং ও জিরো হিডেন ফি।</p>', 3, 1],
          ['partners', 'ভেন্ডর ও রিসেলার পার্টনার্স', '<p>অনুমোদিত স্থানীয় ও আন্তর্জাতিক সফটওয়্যার ভেন্ডরদের সাথে যৌথ কোলাবোরেশন, যা আমাদের স্টক সবসময় সমৃদ্ধ রাখতে এবং সাশ্রয়ী মূল্যে পণ্য সরবরাহ করতে সহায়তা করে। সরাসরি অথরাইজড সাপ্লায়ার নেটওয়ার্ক ও বাল্ক অর্ডার সুবিধা।</p>', 4, 1],
          ['partners', 'আমাদের সাথে পার্টনার হিসেবে কাজ করতে চান?', '<p>আপনি যদি কোনো ডিজিটাল সেবার ভেন্ডর, সাপ্লায়ার বা রিসেলার হয়ে থাকেন এবং আমাদের সাথে অংশীদারিত্ব স্থাপন করতে আগ্রহী হন, তবে সরাসরি আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।</p>', 5, 1],

          // Privacy Policy
          ['privacy', '১. আমরা কী কী তথ্য সংগ্রহ করি (Information We Collect)', '<p>আপনি যখন আমাদের সাইটে অ্যাকাউন্ট তৈরি করেন, অর্ডার সম্পন্ন করেন কিংবা কাস্টমার সাপোর্টে যোগাযোগ করেন, তখন আমরা প্রয়োজনীয় কিছু তথ্য সংগ্রহ করি:</p><ul><li><strong>অ্যাকাউন্ট সম্পর্কিত তথ্য:</strong> আপনার নাম, সক্রিয় ইমেইল অ্যাড্রেস এবং সুরক্ষিত পাসওয়ার্ড।</li><li><strong>যোগাযোগের বিবরণ:</strong> হোয়াটসঅ্যাপ নম্বর এবং মোবাইল ফোন নম্বর (অর্ডার ডেলিভারি ও আপডেটের সুবিধার্থে)।</li><li><strong>লেনদেনের তথ্য:</strong> আপনার অর্ডার করা ডিজিটাল প্রোডাক্ট/সাবস্ক্রিপশনের বিবরণ, পেমেন্ট মেথড (যেমন: বিকাশ, নগদ ইত্যাদি) এবং ট্রানজেকশন আইডি।</li></ul>', 1, 1],
          ['privacy', '২. সংগৃহীত তথ্যের ব্যবহার (How We Use Your Information)', '<p>আপনাকে নিরবচ্ছিন্ন ও মানসম্মত সেবা প্রদানের স্বার্থেই আপনার তথ্য ব্যবহৃত হয়:</p><ul><li>অর্ডারকৃত ডিজিটাল সাবস্ক্রিপশন, লাইসেন্স কি অথবা অ্যাক্টিভেশন ক্রেডেনশিয়াল সঠিক ঠিকানায় দ্রুত ডেলিভারি নিশ্চিত করতে।</li><li>অর্ডারের বর্তমান অবস্থা, রিনিউয়াল রিমাইন্ডার এবং ট্র্যাকিং নোটিফিকেশন পাঠাতে।</li><li>হোয়াটসঅ্যাপ বা ইমেইলের মাধ্যমে সরাসরি কাস্টমার সাপোর্ট ও প্রয়োজনীয় দিকনির্দেশনা দিতে।</li><li>অননুমোদিত লেনদেন বা জালিয়াতি রোধ করে প্ল্যাটফর্মের সামগ্রিক নিরাপত্তা নিশ্চিত করতে।</li></ul>', 2, 1],
          ['privacy', '৩. তথ্যের সুরক্ষা ও নিরাপত্তা (Data Security & Retention)', '<p>আপনার তথ্যের সুরক্ষার জন্য আমরা সর্বাধুনিক প্রশাসনিক, প্রযুক্তিগত ও ইলেকট্রনিক সিকিউরিটি প্রটোকল ব্যবহার করি। আপনার অ্যাকাউন্টের পাসওয়ার্ড শক্তিশালী ক্রিপ্টোগ্রাফিক হ্যাশিংয়ের মাধ্যমে সংরক্ষিত থাকে, ফলে কোনো অবস্থাতেই তা প্লেইন টেক্সট হিসেবে দৃশ্যমান থাকে না।</p>', 3, 1],
          ['privacy', '৪. তৃতীয় পক্ষের সাথে তথ্য আদান-প্রদান (Information Sharing)', '<p>ElitePassBD কখনোই কোনো ব্যবহারকারীর ব্যক্তিগত তথ্য কোনো বাণিজ্যিক উদ্দেশ্যে বিক্রি, ভাড়া বা বিনিময় করে না। শুধুমাত্র আপনার অর্ডার যাচাইকরণের জন্য পেমেন্ট গেটওয়ে প্রোভাইডার (যেমন বিকাশ বা নগদ) অথবা দেশের প্রচলিত আইনের বাধ্যবাধকতা ছাড়া কোনো তৃতীয় পক্ষের সাথে তথ্য শেয়ার করা হয় না।</p>', 4, 1],
          ['privacy', '৫. নীতিমালা পরিবর্তন ও আপনার অধিকার', '<p>ElitePassBD যেকোনো সময় তার নীতিমালায় প্রয়োজনীয় পরিবর্তন বা পরিমার্জন করার অধিকার সংরক্ষণ করে। যেকোনো বড় ধরনের পরিবর্তনে এই পাতায় আপডেট তারিখ প্রকাশ করা হবে। আপনার অ্যাকাউন্ট বা সংরক্ষিত তথ্য আপডেট বা সংশোধন করার প্রয়োজন হলে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করতে পারেন।</p>', 5, 1],

          // Terms of Service
          ['terms', '১. শর্তাবলীর স্বীকৃতি (Acceptance of Terms)', '<p>আমাদের ওয়েবসাইটে অ্যাকাউন্ট তৈরি কিংবা অর্ডার প্রদান করে আপনি নিশ্চিত করছেন যে আপনার বয়স ন্যূনতম ১৮ বছর (অথবা অভিভাবকের অনুমতি রয়েছে) এবং আপনি এই শর্তাবলীর প্রতি পূর্ণাঙ্গভাবে দায়বদ্ধ থাকতে সম্মত। আপনি যদি এই শর্তাবলী মেনে নিতে সম্মত না হন, তবে অনুগ্রহ করে আমাদের প্ল্যাটফর্ম ব্যবহার করা থেকে বিরত থাকুন।</p>', 1, 1],
          ['terms', '২. ডিজিটাল পণ্য ও ডেলিভারি নীতিমালা (Digital Products & Delivery)', '<p>ElitePassBD প্রিমিয়াম ডিজিটাল লাইসেন্স কি, সাবস্ক্রিপশন অ্যাকাউন্ট এবং ভেরিফায়েড অ্যাক্টিভেশন সেবা সরবরাহ করে। যেহেতু এগুলো সম্পূর্ণ ডিজিটাল সেবা, তাই নিচের ডেলিভারি নীতিমালা প্রযোজ্য হবে: ইলেকট্রনিক ডেলিভারি সরাসরি ড্যাশবোর্ড ও হোয়াটসঅ্যাপে প্রদান করা হবে। প্রতিটি লাইসেন্স ডেলিভারির পূর্বে যাচাই করা হয়। একবার ডেলিভারির পর স্বাভাবিক ক্ষেত্রে অর্ডার বাতিলযোগ্য নয়।</p>', 2, 1],
          ['terms', '৩. পেমেন্ট ও মূল্য নির্ধারণ পলিসি (Payment & Pricing Policy)', '<p>ওয়েবসাইটে প্রদর্শিত সকল পণ্যের মূল্য বাংলাদেশি টাকা (BDT / ৳)-তে নির্ধারিত। আন্তর্জাতিক বাজার ও ডলারের মূল্য ওঠানামার ওপর ভিত্তি করে পূর্ব নোটিশ ছাড়াই যেকোনো সময় মূল্য সমন্বয়ের অধিকার আমাদের থাকবে। গ্রাহককে সঠিক ট্রানজেকশন আইডি প্রদান করতে হবে।</p>', 3, 1],
          ['terms', '৪. দায়বদ্ধতার সীমাবদ্ধতা (Limitations of Liability)', '<p>ElitePassBD ডিজিটাল সার্ভিসের বৈধ অ্যাক্টিভেশন নিশ্চিত করে। তবে কোনো তৃতীয় পক্ষ প্ল্যাটফর্ম (যেমন: Netflix, Spotify, OpenAI, Microsoft ইত্যাদি) যদি তাদের অভ্যন্তরীণ নীতিমালা পরিবর্তন করে কিংবা ব্যবহারকারীর নিজস্ব ভুলের কারণে অ্যাকাউন্টে কোনো সীমাবদ্ধতা আরোপ করে, তবে সেক্ষেত্রে আমাদের সহায়তা নীতিমালা অনুযায়ী পদক্ষেপ নেওয়া হবে।</p>', 4, 1],
          ['terms', '৫. গ্রাহকের দায়িত্ব ও সততা', '<p>গ্রাহক হিসেবে আপনি প্রদত্ত লাইসেন্স বা অ্যাকাউন্ট ব্যবহারের সময় নির্দিষ্ট নিয়মাবলী মেনে চলতে সম্মত। শেয়ার্ড অ্যাকাউন্টের ক্ষেত্রে পাসওয়ার্ড বা প্রোফাইল সেটিংস পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ এবং এমন কার্যকলাপের ফলে ওয়ারেন্টি বাতিল হতে পারে।</p>', 5, 1],

          // Refund Policy
          ['refund', '১. ডিজিটাল পণ্যের প্রকৃতি (Nature of Digital Goods)', '<p>যেহেতু <strong>ElitePassBD</strong> সম্পূর্ণ ডিজিটাল সেবা (যেমন: সাবস্ক্রিপশন অ্যাকাউন্ট, সফটওয়্যার লাইসেন্স কি, গিফট কার্ড ও অ্যাক্টিভেশন লিঙ্ক) সরবরাহ করে, তাই একবার কোনো লাইসেন্স বা অ্যাকাউন্ট ক্রেডেনশিয়াল হোয়াটসঅ্যাপ, ইমেইল অথবা ইউজার ড্যাশবোর্ডে সফলভাবে প্রদান করা হলে তা তাৎক্ষণিকভাবে ব্যবহৃত হিসেবে গণ্য হয়। এই কারণে মনের পরিবর্তন বা ভুলবশত অর্ডারের ক্ষেত্রে কোনো সাধারণ রিফান্ড প্রদান করা সম্ভব নয়।</p>', 1, 1],
          ['refund', '২. অকার্যকর বা ত্রুটিপূর্ণ লাইসেন্সের ক্ষেত্রে রিপ্লেসমেন্ট ও রিফান্ড', '<p>আমরা প্রতিটি পণ্যের কার্যকারিতা শতভাগ নিশ্চিত করে ডেলিভারি দিয়ে থাকি। এর পরেও যদি কোনো কারণে প্রদত্ত কি বা অ্যাকাউন্টে ত্রুটি দেখা দেয়, তবে অর্ডার ডেলিভারির <strong>৪৮ ঘণ্টার মধ্যে</strong> স্ক্রিনশট বা প্রুফসহ আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন। সমস্যা নিশ্চিত হলে প্রথমে দ্রুত রিপ্লেসমেন্ট প্রদান করা হবে; অন্যথায় সম্পূর্ণ অর্থ রিফান্ড করা হবে।</p>', 2, 1],
          ['refund', '৩. ভেরিফিকেশন বিলম্ব ও অর্ডার বাতিল', '<p>যেসব অর্ডারে ম্যানুয়াল পেমেন্ট যাচাইকরণের প্রয়োজন হয় (যেমন বিকাশ/নগদ ট্রানজেকশন), তা সাধারণত ১ থেকে ১২ ঘণ্টার মধ্যে যাচাই সম্পন্ন হয়। যদি স্টক ঘাটতি কিংবা কোনো অনিবার্য কারণে আমরা আপনার অর্ডার সরবরাহ করতে ব্যর্থ হই, তবে অবিলম্বে সম্পূর্ণ অর্থ রিফান্ড করা হবে।</p>', 3, 1],
          ['refund', '৪. রিফান্ড প্রসেসিং সময় ও মাধ্যম (Refund Processing)', '<p>অনুমোদিত রিফান্ডের অর্থ সরাসরি গ্রাহকের মূল পেমেন্ট মাধ্যমে (বিকাশ অথবা নগদ নম্বর) <strong>৩ থেকে ৫ কার্যদিবসের মধ্যে</strong> ফেরত পাঠানো হবে। রিফান্ডের জন্য গ্রাহকের কাছ থেকে কোনো প্রকার অতিরিক্ত ফি বা চার্জ কর্তন করা হবে না।</p>', 4, 1],
          ['refund', '৫. সহায়তা প্রয়োজন?', '<p>এই নীতিমালা সম্পর্কিত কোনো জিজ্ঞাসা থাকলে কিংবা লাইসেন্স অ্যাক্টিভেশনে কোনো অসুবিধা হলে দ্বিধাহীনভাবে আমাদের সাপোর্ট সেন্টারে টিকিট ওপেন করুন অথবা সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপ হেল্পলাইনে মেসেজ দিন।</p>', 5, 1],

          // DMCA Policy
          ['dmca', '১. কপিরাইট লঙ্ঘন সংক্রান্ত বিজ্ঞপ্তি (Copyright Infringement Notice)', '<p>আপনি যদি কোনো কপিরাইট স্বত্বাধিকারী হন কিংবা তার অনুমোদিত প্রতিনিধি হন এবং বিশ্বাস করেন যে আমাদের ওয়েবসাইটে প্রদর্শিত কোনো কনটেন্ট, লোগো বা উপাদান আপনার কপিরাইট লঙ্ঘন করেছে, তবে অনুগ্রহ করে আমাদের নির্দিষ্ট কপিরাইট প্রতিনিধির নিকট লিখিত ডিএমসিএ নোটিশ প্রেরণ করুন।</p>', 1, 1],
          ['dmca', '২. নোটিশে যেসকল তথ্য থাকা আবশ্যক (Required Information)', '<p>একটি কার্যকর নোটিশে অবশ্যই থাকতে হবে: কপিরাইট স্বত্বাধিকারীর স্বাক্ষর, কপিরাইটযুক্ত কাজের স্পষ্ট বিবরণ, লঙ্ঘনকারী কনটেন্টের সুনির্দিষ্ট লিঙ্ক (URL), যোগাযোগের সম্পূর্ণ তথ্য, এবং তথ্যের নির্ভুলতা বিষয়ক আইনানুগ বিবৃতি।</p>', 2, 1],
          ['dmca', '৩. নোটিশ প্রাপ্তির পর আমাদের পদক্ষেপ (Our Actions)', '<p>সঠিক ও আইনানুগ ডিএমসিএ নোটিশ পাওয়ার পর, ElitePassBD অবিলম্বে উল্লিখিত লঙ্ঘনকারী উপাদান পর্যালোচনা করবে এবং প্রযোজ্য ক্ষেত্রে অনতিবিলম্বে তা সাইট থেকে অপসারণ বা প্রবেশাধিকার স্থগিত করবে।</p>', 3, 1],
          ['dmca', '৪. কাউন্টার নোটিফিকেশন প্রক্রিয়া (Counter-Notification)', '<p>যদি কোনো ব্যবহারকারী বিশ্বাস করেন যে ভুলবশত বা ভুল পরিচয়ের কারণে তার কোনো উপাদান অপসারণ করা হয়েছে, তবে তিনি প্রয়োজনীয় প্রমাণ ও আইনি সম্মতির মাধ্যমে আমাদের কাছে একটি লিখিত কাউন্টার নোটিফিকেশন দাখিল করতে পারেন।</p>', 4, 1],
          ['dmca', '৫. কপিরাইট সংক্রান্ত যোগাযোগের ঠিকানা (Designated Contact)', '<p>ElitePassBD Legal & DMCA Department<br />ইমেইল: support@elitepassbd.com<br />হেল্পলাইন: হোয়াটসঅ্যাপ সাপোর্ট সেন্টার<br />ঠিকানা: ঢাকা, বাংলাদেশ</p>', 5, 1]
        ];

        for (const row of seedData) {
          await pool.query(
            "INSERT INTO page_sections (page_key, title, content, sort_order, is_active) VALUES (?, ?, ?, ?, ?)",
            row
          );
        }
        console.log("Successfully seeded default page sections.");
      }
    } catch (pageSecErr) {
      console.error("Error ensuring page_sections table:", pageSecErr.message);
    }
  } catch (error) {
    console.error("Error updating database schema:", error.message);
  }
}

initDB();

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  getPool: () => pool
};
