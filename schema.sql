-- ==========================================================
-- ElitePassBD Complete Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ and MariaDB
-- Note: Select your database in phpMyAdmin before running this script
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    whatsapp_number VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products Table
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
    is_instant TINYINT DEFAULT 0,
    is_top_selling TINYINT DEFAULT 0,
    bullet_points TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    shipping_address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
    cancel_reason VARCHAR(255) DEFAULT NULL,
    additional_notes TEXT DEFAULT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Cancelled') DEFAULT 'Pending',
    delivery_email VARCHAR(255) DEFAULT NULL,
    client_ip VARCHAR(255) DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    coupon_code VARCHAR(50) DEFAULT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    review_email_sent TINYINT DEFAULT 0,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    package_name VARCHAR(255) DEFAULT NULL,
    selected_device VARCHAR(255) DEFAULT NULL,
    selected_activation VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL DEFAULT NULL,
    reviewer_name VARCHAR(255) DEFAULT NULL,
    reviewer_email VARCHAR(255) DEFAULT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Support Tickets Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Product Licenses Table
CREATE TABLE IF NOT EXISTS product_licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    activation_option TEXT DEFAULT NULL,
    package_option TEXT DEFAULT NULL,
    rules LONGTEXT DEFAULT NULL,
    license_key LONGTEXT NOT NULL,
    is_used TINYINT DEFAULT 0,
    used_at DATETIME DEFAULT NULL,
    order_item_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
    INDEX idx_product_is_used (product_id, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. EPS Payment History Table
CREATE TABLE IF NOT EXISTS eps_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_transaction_id VARCHAR(255) NOT NULL,
    eps_transaction_id VARCHAR(255) DEFAULT NULL,
    order_id INT DEFAULT NULL,
    amount DECIMAL(10, 2) DEFAULT NULL,
    status VARCHAR(50) DEFAULT NULL,
    raw_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Slides Table
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Coupons Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(30) NOT NULL,
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
    status ENUM('Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled') DEFAULT 'Active',
    notes TEXT DEFAULT NULL,
    order_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_sub_status_expiry (status, expiry_date),
    INDEX idx_sub_phone (whatsapp_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Renewal History Table
CREATE TABLE IF NOT EXISTS subscription_renewals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    validity_days INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Current', 'Previous') DEFAULT 'Current',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Reminder History Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Subscription Settings Table
CREATE TABLE IF NOT EXISTS subscription_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Initial Default Data Seeds
-- ==========================================================

-- Default Admin Account: admin@example.com / admin123
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@example.com', '$2a$10$wK1F5lCqU.s5/D7fGv3Kfe.Z3FEX2VwE885g9qLDRX2yN60p2G9nK', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Default Site Settings
INSERT IGNORE INTO site_settings (setting_key, setting_value)
VALUES 
  ('marquee_enabled', 'true'),
  ('marquee_speed', '35'),
  ('marquee_items', '[{"id":"1","badge":"বিশেষ অফার","text":"সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান","badgeColor":"purple","textColor":"violet"},{"id":"2","badge":"🛡️ 100% Genuine","text":"Genuine Digital License & Instant Email Delivery","badgeColor":"emerald","textColor":"emerald"},{"id":"3","badge":"⭐ 50,000+","text":"Trusted by Happy Customers in Bangladesh","badgeColor":"amber","textColor":"amber"}]'),
  ('support_whatsapp', '8801925112444'),
  ('support_email', 'info@elitepassbd.com'),
  ('social_facebook', 'https://facebook.com/ElitePassBD'),
  ('social_instagram', 'https://instagram.com/elitepassbd'),
  ('social_youtube', 'https://youtube.com/elitepassbd'),
  ('social_linkedin', 'https://linkedin.com/elitepassbd'),
  ('social_messenger', 'https://m.me/elitepassbd');

-- Default Subscription Settings
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
  ('email_body_template', 'Hello {customer_name},\n\nYour {product_name} subscription ({package_plan}) is set to expire on {expiry_date}.\n\nTo keep your access uninterrupted, please complete your renewal payment.\n\nThank you,\nElitePassBD'),
  ('admin_alert_dashboard', 'true'),
  ('admin_alert_email', 'true'),
  ('admin_alert_whatsapp', 'true'),
  ('admin_email', 'admin@elitepassbd.com'),
  ('admin_whatsapp', '');
