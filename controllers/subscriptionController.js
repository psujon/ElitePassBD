const db = require('../config/db');
const { processSubscriptionStatuses } = require('../services/subscriptionCronService');
const { getDirectWhatsAppUrl, replaceTemplateTags } = require('../services/whatsappService');

/**
 * Calculate dashboard stat counts in a single optimized SQL query
 */
const getDashboardStats = async (pool, product = null) => {
  try {
    const hasProduct = Boolean(product && product.trim() && product.trim() !== 'All Products');
    const prodClause = hasProduct ? ' AND product_name LIKE ?' : '';
    const prodParams = hasProduct ? [`%${product.trim()}%`] : [];

    const statsSql = `
      SELECT 
        COUNT(CASE WHEN status IN ('Active', 'Expiring Soon') AND expiry_date >= CURDATE() THEN 1 END) as active,
        COUNT(CASE WHEN expiry_date = CURDATE() AND status NOT IN ('Cancelled', 'Not Renewed') THEN 1 END) as expiringToday,
        COUNT(CASE WHEN expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status NOT IN ('Cancelled', 'Not Renewed') THEN 1 END) as within3Days,
        COUNT(CASE WHEN expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status NOT IN ('Cancelled', 'Not Renewed') THEN 1 END) as within7Days,
        COUNT(CASE WHEN status = 'Expired' OR (expiry_date < CURDATE() AND status NOT IN ('Cancelled', 'Not Renewed')) THEN 1 END) as expired,
        COUNT(CASE WHEN status = 'Renewed' OR id IN (SELECT DISTINCT subscription_id FROM subscription_renewals WHERE status = 'Previous') THEN 1 END) as renewed,
        COUNT(CASE WHEN status = 'Not Renewed' THEN 1 END) as notRenewed,
        COUNT(DISTINCT CASE 
          WHEN email IS NOT NULL AND TRIM(email) != '' THEN LOWER(TRIM(email))
          WHEN whatsapp_number IS NOT NULL AND TRIM(whatsapp_number) != '' THEN CONCAT('phone_', TRIM(whatsapp_number))
          ELSE NULL 
        END) as totalCustomers,
        COUNT(*) as totalSubscriptions
      FROM subscriptions
      WHERE 1=1 ${prodClause}
    `;

    const [[row]] = await pool.query(statsSql, prodParams);

    return {
      active: Number(row?.active) || 0,
      expiringToday: Number(row?.expiringToday) || 0,
      within3Days: Number(row?.within3Days) || 0,
      within7Days: Number(row?.within7Days) || 0,
      expired: Number(row?.expired) || 0,
      renewed: Number(row?.renewed) || 0,
      notRenewed: Number(row?.notRenewed) || 0,
      totalCustomers: Number(row?.totalCustomers) || 0,
      totalSubscriptions: Number(row?.totalSubscriptions) || 0
    };
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return {
      active: 0,
      expiringToday: 0,
      within3Days: 0,
      within7Days: 0,
      expired: 0,
      renewed: 0,
      notRenewed: 0,
      totalCustomers: 0,
      totalSubscriptions: 0
    };
  }
};

let lastStatusProcessTime = 0;
const maybeProcessStatusesInBackground = (pool) => {
  const now = Date.now();
  // Run status update in background at most once every 15 minutes, never blocking HTTP GET requests
  if (now - lastStatusProcessTime > 15 * 60 * 1000) {
    lastStatusProcessTime = now;
    processSubscriptionStatuses(pool).catch(err => {
      console.warn('[subscriptionController] Background status process warning:', err.message);
    });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const pool = db.getPool();
    // Non-blocking background checks
    ensureSubscriptionColumns(pool).catch(() => {});
    maybeProcessStatusesInBackground(pool);

    const { search, product, status, source, expiryFilter } = req.query;

    let query = `
      SELECT s.*, o.created_at AS order_created_at,
             v.name AS vendor_name, v.company_name AS vendor_company, v.phone AS vendor_phone
      FROM subscriptions s
      LEFT JOIN orders o ON s.order_id = o.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      const trimmed = search.trim();
      const searchTerm = `%${trimmed}%`;

      // 1. Explicit Order ID query (e.g. "#125", "Order #125", "order 125", "Order-125")
      const explicitOrderMatch = trimmed.match(/^(?:order[\s:#-]*#?|#)\s*(\d+)$/i);

      // 2. Pure number query (e.g. "125" or "01712345678")
      const pureNumberMatch = trimmed.match(/^(\d+)$/);

      if (explicitOrderMatch) {
        // User explicitly searched for an Order ID -> exact match on order_id (or fallback to manual sub id if order_id is null)
        const orderId = parseInt(explicitOrderMatch[1], 10);
        query += ` AND (s.order_id = ? OR (s.order_id IS NULL AND s.id = ?))`;
        params.push(orderId, orderId);
      } else if (pureNumberMatch) {
        // User typed a pure number -> exact match on order_id OR search phone, name, email, product, vendor
        const num = parseInt(pureNumberMatch[1], 10);
        query += ` AND (
          s.order_id = ? OR
          (s.order_id IS NULL AND s.id = ?) OR
          s.customer_name LIKE ? OR
          s.whatsapp_number LIKE ? OR
          s.email LIKE ? OR
          s.product_name LIKE ? OR
          v.name LIKE ? OR
          v.company_name LIKE ?
        )`;
        params.push(
          num,
          num,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm
        );
      } else {
        // General text query (name, phone, email, product, account details, vendor, etc.)
        query += ` AND (
          s.customer_name LIKE ? OR
          s.whatsapp_number LIKE ? OR
          s.email LIKE ? OR
          s.product_name LIKE ? OR
          s.account_given LIKE ? OR
          v.name LIKE ? OR
          v.company_name LIKE ?
        )`;
        params.push(
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm
        );
      }
    }

    if (product && product.trim() && product !== 'All Products') {
      query += ` AND s.product_name LIKE ?`;
      params.push(`%${product.trim()}%`);
    }

    if (status && status.trim() && status !== 'All Status') {
      const sTrim = status.trim();
      if (sTrim === 'Expired' || sTrim === 'Expired Only') {
        query += ` AND (s.status = 'Expired' OR (s.expiry_date < CURDATE() AND s.status NOT IN ('Cancelled', 'Not Renewed')))`;
      } else if (sTrim === 'Expired & Not Renewed') {
        query += ` AND s.status IN ('Expired', 'Not Renewed')`;
      } else {
        query += ` AND s.status = ?`;
        params.push(sTrim);
      }
    }

    if (source && source.trim() && source !== 'All Sources') {
      query += ` AND s.customer_source = ?`;
      params.push(source.trim());
    }

    if (expiryFilter && expiryFilter !== 'All Dates') {
      const isExplicitStatus = Boolean(status && status !== 'All Status');
      const excludeClause = isExplicitStatus ? '' : ` AND s.status NOT IN ('Cancelled', 'Not Renewed')`;

      if (expiryFilter === 'today') {
        query += ` AND s.expiry_date = CURDATE()${excludeClause}`;
      } else if (expiryFilter === '3days') {
        query += ` AND s.expiry_date >= CURDATE() AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)${excludeClause}`;
      } else if (expiryFilter === '7days') {
        query += ` AND s.expiry_date >= CURDATE() AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)${excludeClause}`;
      } else if (expiryFilter === 'expired') {
        query += ` AND (s.expiry_date < CURDATE() OR s.status = 'Expired') AND s.status NOT IN ('Cancelled', 'Not Renewed')`;
      }
    }

    query += ` ORDER BY COALESCE(s.order_id, s.id) DESC, s.id DESC`;

    // Execute Main Query, Settings Query, and Dashboard Stats simultaneously in parallel
    const [
      [rows],
      [settingRows],
      stats
    ] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT setting_key, setting_value FROM subscription_settings'),
      getDashboardStats(pool, product)
    ]);

    const settings = {};
    settingRows.forEach(s => settings[s.setting_key] = s.setting_value);
    const waTemplate = settings.whatsapp_template || `Hello {customer_name}, your {product_name} subscription expires on {expiry_date}. Please complete renewal payment to continue. Thank you, ElitePassBD.`;

    // Attach direct wa.me link to each subscription item
    const items = rows.map(sub => {
      const formattedExpiry = sub.expiry_date ? new Date(sub.expiry_date).toISOString().slice(0, 10) : '';
      const text = replaceTemplateTags(waTemplate, {
        customer_name: sub.customer_name,
        product_name: sub.product_name,
        package_plan: sub.package_plan,
        expiry_date: formattedExpiry
      });
      return {
        ...sub,
        direct_whatsapp_url: getDirectWhatsAppUrl(sub.whatsapp_number, text)
      };
    });

    res.json({
      stats,
      subscriptions: items
    });
  } catch (err) {
    console.error('Get all subscriptions error:', err);
    res.status(500).json({ message: 'Database error fetching subscriptions.' });
  }
};

let subColsEnsured = false;
async function ensureSubscriptionColumns(pool) {
  if (subColsEnsured) return;
  try {
    const [ordNameCols] = await pool.query("SHOW COLUMNS FROM orders LIKE 'customer_name'");
    if (ordNameCols.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL AFTER user_id");
    }
    const [cCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'customer_notes'");
    if (cCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN customer_notes TEXT DEFAULT NULL AFTER notes");
    }
    const [aCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'admin_notes'");
    if (aCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER customer_notes");
    }
    const [lrCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'license_rules'");
    if (lrCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN license_rules LONGTEXT DEFAULT NULL AFTER account_given");
    }
    const [rcCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'customer_notes'");
    if (rcCols.length === 0) {
      await pool.query("ALTER TABLE subscription_renewals ADD COLUMN customer_notes TEXT DEFAULT NULL AFTER notes");
    }
    const [raCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'admin_notes'");
    if (raCols.length === 0) {
      await pool.query("ALTER TABLE subscription_renewals ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER customer_notes");
    }
    const [daCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'digital_account_id'");
    if (daCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN digital_account_id INT DEFAULT NULL");
    }
    const [dsCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'digital_slot_id'");
    if (dsCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN digital_slot_id INT DEFAULT NULL");
    }
    const [vCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'vendor_id'");
    if (vCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN vendor_id INT DEFAULT NULL");
    }
    const [vpCols] = await pool.query("SHOW COLUMNS FROM subscriptions LIKE 'vendor_price'");
    if (vpCols.length === 0) {
      await pool.query("ALTER TABLE subscriptions ADD COLUMN vendor_price DECIMAL(10, 2) DEFAULT 0.00");
    }
    const [daRenCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'digital_account_id'");
    if (daRenCols.length === 0) {
      await pool.query("ALTER TABLE subscription_renewals ADD COLUMN digital_account_id INT DEFAULT NULL");
    }
    const [dsRenCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'digital_slot_id'");
    if (dsRenCols.length === 0) {
      await pool.query("ALTER TABLE subscription_renewals ADD COLUMN digital_slot_id INT DEFAULT NULL");
    }
    const [accRenCols] = await pool.query("SHOW COLUMNS FROM subscription_renewals LIKE 'account_given'");
    if (accRenCols.length === 0) {
      await pool.query("ALTER TABLE subscription_renewals ADD COLUMN account_given LONGTEXT DEFAULT NULL AFTER amount");
    }

    // Backfill any existing subscription_renewals that have empty account_given or missing slot info
    try {
      await pool.query(`
        UPDATE subscription_renewals r
        JOIN subscriptions s ON r.subscription_id = s.id
        SET r.account_given = s.account_given
        WHERE (r.account_given IS NULL OR r.account_given = '')
          AND (s.account_given IS NOT NULL AND s.account_given != '')
      `);
      await pool.query(`
        UPDATE subscription_renewals r
        JOIN subscriptions s ON r.subscription_id = s.id
        SET r.digital_account_id = COALESCE(r.digital_account_id, s.digital_account_id),
            r.digital_slot_id = COALESCE(r.digital_slot_id, s.digital_slot_id)
        WHERE r.digital_account_id IS NULL AND s.digital_account_id IS NOT NULL
      `);
    } catch (backfillErr) {
      // non-blocking backfill
    }

    try {
      await pool.query("ALTER TABLE order_items MODIFY COLUMN selected_activation TEXT DEFAULT NULL");
    } catch (e) {
      // ignore
    }
    try {
      await pool.query("ALTER TABLE subscriptions MODIFY COLUMN status ENUM('Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled', 'Not Renewed') DEFAULT 'Active'");
    } catch (e) {
      // ignore
    }
    subColsEnsured = true;
  } catch (err) {
    console.warn("ensureSubscriptionColumns error:", err.message);
  }
}

exports.getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    await ensureSubscriptionColumns(pool);

    let subs = [];
    try {
      const [resSubs] = await pool.query(`
        SELECT s.*, o.created_at AS order_created_at,
               v.name AS vendor_name, v.company_name AS vendor_company, v.phone AS vendor_phone,
               dla.product_name AS digital_account_product, dla.account_email AS digital_account_email,
               dls.slot_number AS digital_slot_number
        FROM subscriptions s
        LEFT JOIN orders o ON s.order_id = o.id
        LEFT JOIN vendors v ON s.vendor_id = v.id
        LEFT JOIN digital_license_accounts dla ON s.digital_account_id = dla.id
        LEFT JOIN digital_license_slots dls ON s.digital_slot_id = dls.id
        WHERE s.id = ?
      `, [id]);
      subs = resSubs;
    } catch (joinErr) {
      console.warn('Subscription join query fallback:', joinErr.message);
      const [resSubs] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
      subs = resSubs;
    }

    if (!subs || subs.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const sub = subs[0];

    let renewals = [];
    try {
      const [r] = await pool.query(`
        SELECT r.*,
               dla.product_name AS digital_account_product,
               dla.account_email AS digital_account_email,
               dls.slot_number AS digital_slot_number
        FROM subscription_renewals r
        LEFT JOIN digital_license_accounts dla ON r.digital_account_id = dla.id
        LEFT JOIN digital_license_slots dls ON r.digital_slot_id = dls.id
        WHERE r.subscription_id = ?
        ORDER BY r.id DESC
      `, [id]);

      renewals = (r || []).map(row => {
        const isCurrentOrOnly = row.status === 'Current' || (r && r.length === 1);
        const accGiven = (row.account_given && row.account_given.trim())
          ? row.account_given
          : (isCurrentOrOnly ? (sub.account_given || '') : '');
        const digEmail = row.digital_account_email || (isCurrentOrOnly ? (sub.digital_account_email || '') : '');
        const digSlot = row.digital_slot_number || (isCurrentOrOnly ? (sub.digital_slot_number || null) : null);
        const digProd = row.digital_account_product || (isCurrentOrOnly ? (sub.digital_account_product || '') : '');
        return {
          ...row,
          account_given: accGiven,
          digital_account_email: digEmail,
          digital_slot_number: digSlot,
          digital_account_product: digProd
        };
      });
    } catch (renErr) {
      console.warn('Renewals table query skipped:', renErr.message);
    }

    let reminders = [];
    try {
      const [rem] = await pool.query('SELECT * FROM subscription_reminders WHERE subscription_id = ? ORDER BY id DESC', [id]);
      reminders = rem || [];
    } catch (remErr) {
      console.warn('Reminders table query skipped:', remErr.message);
    }

    res.json({
      ...sub,
      renewals,
      reminders
    });
  } catch (err) {
    console.error('Get subscription detail error:', err);
    res.status(500).json({ message: 'Error fetching subscription details: ' + (err.message || '') });
  }
};

const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText, formatRulesHtml, formatLicenseKeyHtml } = require('../utils/mailer');

/**
 * Send dedicated License & Subscription Details Email to the customer
 */
const sendSubscriptionLicenseEmail = async ({
  email,
  customerName,
  productName,
  packagePlan,
  licenseKey,
  rules,
  purchaseDate,
  validityDays,
  expiryDate,
  orderId,
  customerNotes
}) => {
  if (!email || !email.trim()) return false;

  const appName = process.env.APP_NAME || 'ElitePassBD';
  const subject = licenseKey
    ? `Your License Key & Access Details - ${productName} - ${appName}`
    : `Your Subscription Details & Usage Rules - ${productName} - ${appName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your License & Subscription Details</title>
      <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0b1120; }
        .body-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        .body-td { padding: 0 !important; margin: 0 !important; }
        * {
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        @media only screen and (max-width: 600px) {
          .body-wrapper { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .body-td { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .email-container { width: 100% !important; max-width: 100% !important; min-width: 100% !important; border-radius: 0 !important; border: none !important; margin: 0 !important; }
          .banner-header { padding: 14px 6px !important; }
          .banner-header h1 { font-size: 16px !important; }
          .main-content { padding: 8px 2px !important; width: 100% !important; }
          .key-box { padding: 6px 4px !important; margin: 6px 0 !important; border-radius: 4px !important; }
          .rules-box { padding: 6px 4px !important; margin: 6px 0 !important; border-radius: 4px !important; }
          .footer-cell { padding: 12px 6px !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
      <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0b1120; margin: 0; padding: 0; border-collapse: collapse;">
        <tr>
          <td align="center" class="body-td" style="padding: 0; margin: 0;">
            <div class="email-container" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 0; overflow: hidden; border: 1px solid #334155;">
              
              <!-- Header -->
              <div class="banner-header" style="background-color: #059669; color: #ffffff; padding: 20px 14px; text-align: center;">
                <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                  Subscription & License Activated!
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                  ${productName} • ${packagePlan}
                </p>
              </div>

              <!-- Body -->
              <div class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
                <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-weight: 600;">
                  Hello ${customerName || 'Valued Customer'},
                </p>
                <p style="font-size: 12px; color: #cbd5e1; line-height: 1.55; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                  Your subscription has been successfully created. Your official digital license key / account credentials and plan details are below:
                </p>

                ${licenseKey ? `
                <!-- License Key Box -->
                <div class="key-box" style="margin: 10px 0; background-color: #0f172a; border: 1.5px dashed #10b981; border-radius: 6px; padding: 8px 10px; text-align: left; box-sizing: border-box; width: 100%;">
                  <div style="font-size: 9.5px; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.6px; margin-bottom: 4px;">
                    Digital License Key / Account Credentials
                  </div>
                  <div style="background-color: #1e293b; padding: 8px 10px; border-radius: 4px; display: block; width: 100%; box-sizing: border-box; border: 1px solid #334155; text-align: left;">
                    ${formatLicenseKeyHtml(licenseKey, true)}
                  </div>
                </div>` : ''}

                <!-- Details Table -->
                <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
                  <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; width: 38%; font-size: 11.5px;">Product:</td>
                      <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${productName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Package / Plan:</td>
                      <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${packagePlan}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Purchase Date:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">${purchaseDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Validity:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">${validityDays} Days</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Expiry Date:</td>
                      <td style="padding: 5px 0; font-weight: 700; color: #34d399; font-size: 12px;">${expiryDate}</td>
                    </tr>
                    ${orderId ? `
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Order Ref:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">#${orderId}</td>
                    </tr>` : ''}
                  </table>
                </div>

                ${customerNotes ? `
                <!-- Customer Notes Box -->
                <div style="background-color: #0f172a; border: 1px solid #334155; border-left: 3px solid #10b981; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 11.5px; color: #cbd5e1; word-break: normal; overflow-wrap: break-word; box-sizing: border-box; width: 100%;">
                  <div style="font-weight: 700; color: #34d399; margin-bottom: 4px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Notes / Instructions:</div>
                  <div style="line-height: 1.5; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word; white-space: pre-wrap;">${customerNotes}</div>
                </div>` : ''}

                ${rules ? formatRulesHtml(rules, true) : ''}

                <!-- WhatsApp Support Contact Box -->
                ${getWhatsAppContactBlock(true)}

              </div>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        ${getEmailFooter(appName, true)}
      </table>
    </body>
    </html>
  `;

  const text = `Hello ${customerName || 'Valued Customer'},\n\nYour subscription for ${productName} (${packagePlan}) has been activated.\n\n${licenseKey ? `License Key / Credentials: ${licenseKey}\n` : ''}Expiry Date: ${expiryDate}\n${customerNotes ? `\nCustomer Notes:\n${customerNotes}\n` : ''}${rules ? `\nProduct Usage Rules:\n${rules}\n` : ''}${getWhatsAppContactText()}`;

  return await sendEmail({
    to: email.trim(),
    subject,
    text,
    html
  });
};

/**
 * Send dedicated Subscription Renewal Confirmation Email to the customer
 */
const sendSubscriptionRenewalEmail = async ({
  email,
  customerName,
  productName,
  packagePlan,
  licenseKey,
  rules,
  renewalDate,
  validityDays,
  expiryDate,
  amount,
  orderId,
  subscriptionId,
  customerNotes
}) => {
  if (!email || !email.trim()) return false;

  const appName = process.env.APP_NAME || 'ElitePassBD';
  const subject = `Subscription Renewed Successfully - ${productName} - ${appName}`;

  const formattedDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : expiryDate;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Renewed - ${appName}</title>
      <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0b1120; }
        .body-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        .body-td { padding: 0 !important; margin: 0 !important; }
        * {
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        @media only screen and (max-width: 600px) {
          .body-wrapper { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .body-td { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .email-container { width: 100% !important; max-width: 100% !important; min-width: 100% !important; border-radius: 0 !important; border: none !important; margin: 0 !important; }
          .banner-header { padding: 14px 6px !important; }
          .banner-header h1 { font-size: 16px !important; }
          .main-content { padding: 8px 2px !important; width: 100% !important; }
          .key-box { padding: 6px 4px !important; margin: 6px 0 !important; border-radius: 4px !important; }
          .rules-box { padding: 6px 4px !important; margin: 6px 0 !important; border-radius: 4px !important; }
          .footer-cell { padding: 12px 6px !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
      <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0b1120; margin: 0; padding: 0; border-collapse: collapse;">
        <tr>
          <td align="center" class="body-td" style="padding: 0; margin: 0;">
            <div class="email-container" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 0; overflow: hidden; border: 1px solid #334155;">
              
              <!-- Header -->
              <div class="banner-header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 20px 14px; text-align: center;">
                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px;">
                  Renewal Successful 🎉
                </div>
                <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                  Subscription Renewed!
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                  ${productName} • ${packagePlan}
                </p>
              </div>

              <!-- Body -->
              <div class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
                <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-weight: 600;">
                  Hello ${customerName || 'Valued Customer'},
                </p>
                <p style="font-size: 12px; color: #cbd5e1; line-height: 1.55; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                  Your subscription with <strong>${appName}</strong> has been successfully renewed. Your service access and account credentials are confirmed below:
                </p>

                ${licenseKey ? `
                <!-- License Key Box -->
                <div class="key-box" style="margin: 10px 0; background-color: #0f172a; border: 1.5px dashed #10b981; border-radius: 6px; padding: 8px 10px; text-align: left; box-sizing: border-box; width: 100%;">
                  <div style="font-size: 9.5px; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.6px; margin-bottom: 4px;">
                    Digital License Key / Account Credentials
                  </div>
                  <div style="background-color: #1e293b; padding: 8px 10px; border-radius: 4px; display: block; width: 100%; box-sizing: border-box; border: 1px solid #334155; text-align: left;">
                    ${formatLicenseKeyHtml(licenseKey, true)}
                  </div>
                </div>` : ''}

                ${customerNotes ? `
                <!-- Customer Notes Box -->
                <div style="background-color: #0f172a; border: 1px solid #334155; border-left: 3px solid #10b981; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 11.5px; color: #cbd5e1; word-break: normal; overflow-wrap: break-word; box-sizing: border-box; width: 100%;">
                  <div style="font-weight: 700; color: #34d399; margin-bottom: 4px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">Renewal Notes / Instructions:</div>
                  <div style="line-height: 1.5; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word; white-space: pre-wrap;">${customerNotes}</div>
                </div>` : ''}

                <!-- Details Table -->
                <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
                  <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; width: 38%; font-size: 11.5px;">Product:</td>
                      <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${productName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Package / Plan:</td>
                      <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${packagePlan}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Renewal Date:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Validity:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">${validityDays} Days</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">New Expiry Date:</td>
                      <td style="padding: 5px 0; font-weight: 700; color: #34d399; font-size: 12px;">${formattedExpiry}</td>
                    </tr>
                    ${amount ? `
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Payment Amount:</td>
                      <td style="padding: 5px 0; font-weight: 700; color: #ffffff; font-size: 12px;">৳${amount} BDT</td>
                    </tr>` : ''}
                    ${orderId ? `
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Order Ref:</td>
                      <td style="padding: 5px 0; color: #ffffff; font-size: 12px;">#${orderId}</td>
                    </tr>` : ''}
                    ${subscriptionId ? `
                    <tr>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Subscription Ref:</td>
                      <td style="padding: 5px 0; color: #94a3b8; font-size: 12px;">#${subscriptionId}</td>
                    </tr>` : ''}
                  </table>
                </div>

                ${rules ? formatRulesHtml(rules, true) : ''}

                <!-- WhatsApp Support Contact Box -->
                ${getWhatsAppContactBlock(true)}

              </div>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        ${getEmailFooter(appName, true)}
      </table>
    </body>
    </html>
  `;

  const text = `Hello ${customerName || 'Valued Customer'},\n\nYour subscription for ${productName} (${packagePlan}) has been renewed.\n\nRenewal Date: ${formattedDate}\nValidity: ${validityDays} Days\nNew Expiry Date: ${formattedExpiry}\n${licenseKey ? `License Key / Credentials: ${licenseKey}\n` : ''}${customerNotes ? `Renewal Notes: ${customerNotes}\n` : ''}${rules ? `Rules: ${rules}\n` : ''}${getWhatsAppContactText()}`;

  return await sendEmail({
    to: email.trim(),
    subject,
    text,
    html
  });
};

exports.createSubscription = async (req, res) => {
  const {
    customer_name,
    whatsapp_number,
    email,
    product_name,
    package_plan,
    customer_source,
    purchase_date,
    validity_days,
    expiry_date,
    account_given,
    license_id,
    license_rules,
    selling_price,
    payment_status,
    notes,
    customer_notes,
    admin_notes,
    order_id,
    vendor_id,
    vendor_price,
    digital_account_id,
    send_email
  } = req.body;

  if (!customer_name || !whatsapp_number || !product_name || !package_plan) {
    return res.status(400).json({ message: 'Customer Name, WhatsApp Number, Product Name, and Package Plan are required.' });
  }

  const pool = db.getPool();
  await ensureSubscriptionColumns(pool);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let finalAccountGiven = account_given || '';
    let finalRules = (license_rules && license_rules.trim()) ? license_rules.trim() : '';

    // If a pre-loaded license was selected, fetch it and verify it's available
    if (license_id) {
      const [licRows] = await connection.query(
        'SELECT id, license_key, rules FROM product_licenses WHERE id = ? AND is_used = 0 FOR UPDATE',
        [license_id]
      );
      if (licRows.length > 0) {
        finalAccountGiven = licRows[0].license_key;
        if (!finalRules && licRows[0].rules) {
          finalRules = licRows[0].rules;
        }
      }
    }

    const pDate = purchase_date ? new Date(purchase_date) : new Date();
    const vDays = parseInt(validity_days) || 30;

    let eDate;
    if (expiry_date) {
      eDate = new Date(expiry_date);
    } else {
      eDate = new Date(pDate);
      eDate.setDate(eDate.getDate() + vDays);
    }

    const formattedPDate = pDate.toISOString().slice(0, 10);
    const formattedEDate = eDate.toISOString().slice(0, 10);

    const todayStr = new Date().toISOString().slice(0, 10);
    let initialStatus = 'Active';
    if (formattedEDate < todayStr) {
      initialStatus = 'Expired';
    } else {
      const diffTime = new Date(formattedEDate) - new Date(todayStr);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        initialStatus = 'Expiring Soon';
      }
    }

    let cleanEmail = (email && typeof email === 'string' && email.trim()) ? email.trim() : null;

    // Filter out Admin email: Customer subscription must NEVER take the admin's email address
    if (cleanEmail) {
      const [adminEmailCheck] = await connection.query(
        'SELECT id FROM users WHERE role = "admin" AND LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
        [cleanEmail]
      );
      if (adminEmailCheck.length > 0) {
        console.warn(`[createSubscription] Filtered out admin email '${cleanEmail}' from customer subscription.`);
        cleanEmail = null;
      }
    }

    let finalOrderId = order_id || null;
    let orderItemId = null;

    // If no existing order_id is provided (Manual / WhatsApp / Facebook entry), create an order in orders & order_items tables
    if (!finalOrderId) {
      try {
        let userId = null;

        // 1. Find or create user
        if (cleanEmail) {
          const [userCheck] = await connection.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
          if (userCheck.length > 0) {
            userId = userCheck[0].id;
          } else {
            const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const [newUserRes] = await connection.query(
              'INSERT INTO users (name, email, password, role, whatsapp_number) VALUES (?, ?, ?, "user", ?)',
              [customer_name || 'Customer', cleanEmail, hashedPassword, whatsapp_number]
            );
            userId = newUserRes.insertId;
          }
        } else {
          // Never link to existing user by phone/email or admin user! Create a separate customer user record
          const cleanDigits = (whatsapp_number || '').replace(/[^0-9]/g, '');
          const guestEmail = `customer_${cleanDigits || Date.now()}_${Math.floor(1000 + Math.random() * 9000)}@guest.elitepassbd.local`;
          const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          const [newUserRes] = await connection.query(
            'INSERT INTO users (name, email, password, role, whatsapp_number) VALUES (?, ?, ?, "user", ?)',
            [customer_name || 'Customer', guestEmail, hashedPassword, whatsapp_number]
          );
          userId = newUserRes.insertId;
        }

        // 2. Find product_id
        let productId = 1;
        const [prodCheck] = await connection.query('SELECT id FROM products WHERE name LIKE ? LIMIT 1', [`%${product_name}%`]);
        if (prodCheck.length > 0) {
          productId = prodCheck[0].id;
        } else {
          const [firstProd] = await connection.query('SELECT id FROM products ORDER BY id ASC LIMIT 1');
          if (firstProd.length > 0) productId = firstProd[0].id;
        }

        // 3. Create Order
        const ordStatus = (payment_status === 'Paid') ? 'Delivered' : 'Pending';
        const [ordRes] = await connection.query(`
          INSERT INTO orders (user_id, customer_name, total_amount, status, shipping_address, phone, payment_method, payment_status, delivery_email, additional_notes, completed_at)
          VALUES (?, ?, ?, ?, 'Manual / Social Order', ?, ?, ?, ?, ?, IF(? = 'Delivered', NOW(), NULL))
        `, [
          userId,
          customer_name ? customer_name.trim() : null,
          parseFloat(selling_price) || 0,
          ordStatus,
          whatsapp_number ? whatsapp_number.trim() : null,
          customer_source || 'Manual Order',
          payment_status || 'Paid',
          cleanEmail || null,
          customer_notes ? customer_notes.trim() : null,
          ordStatus
        ]);

        finalOrderId = ordRes.insertId;

        // 4. Create Order Item
        const safeActivation = finalAccountGiven ? String(finalAccountGiven).slice(0, 250) : null;
        const [ordItemRes] = await connection.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price, package_name, selected_activation)
          VALUES (?, ?, 1, ?, ?, ?)
        `, [
          finalOrderId,
          productId,
          parseFloat(selling_price) || 0,
          package_plan,
          safeActivation
        ]);
        orderItemId = ordItemRes.insertId;
      } catch (ordErr) {
        console.error('Manual order sync error during subscription creation:', ordErr.message);
      }
    }

    // Mark the selected pre-loaded license as used
    if (license_id) {
      await connection.query(
        'UPDATE product_licenses SET is_used = 1, order_item_id = ?, used_at = NOW() WHERE id = ?',
        [orderItemId, license_id]
      );
    }

    const finalAdminNotes = admin_notes ? admin_notes.trim() : (notes ? notes.trim() : null);
    const finalCustomerNotes = customer_notes ? customer_notes.trim() : null;

    const [subResult] = await connection.query(`
      INSERT INTO subscriptions (
        customer_name, whatsapp_number, email, product_name, package_plan,
        customer_source, purchase_date, validity_days, expiry_date, account_given,
        license_rules,
        selling_price, payment_status, status, notes, customer_notes, admin_notes,
        order_id, vendor_id, vendor_price, digital_account_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_name,
      whatsapp_number,
      cleanEmail,
      product_name,
      package_plan,
      customer_source || 'Manual',
      formattedPDate,
      vDays,
      formattedEDate,
      finalAccountGiven || null,
      finalRules || null,
      parseFloat(selling_price) || 0,
      payment_status || 'Paid',
      initialStatus,
      finalAdminNotes,
      finalCustomerNotes,
      finalAdminNotes,
      finalOrderId,
      vendor_id ? parseInt(vendor_id, 10) : null,
      vendor_price !== undefined && vendor_price !== null && vendor_price !== '' ? parseFloat(vendor_price) : 0.00,
      digital_account_id ? parseInt(digital_account_id, 10) : null
    ]);

    const subscriptionId = subResult.insertId;

    // Auto-assign available slot from digital_license_slots if digital_account_id is provided
    let assignedSlotId = null;
    let assignedSlotNumber = null;
    if (digital_account_id) {
      const parsedAccId = parseInt(digital_account_id, 10);
      const [freeSlots] = await connection.query(`
        SELECT id, slot_number FROM digital_license_slots
        WHERE account_id = ? AND (status = 'Available' OR status IS NULL)
        ORDER BY slot_number ASC
        LIMIT 1
        FOR UPDATE
      `, [parsedAccId]);

      if (freeSlots.length > 0) {
        const slot = freeSlots[0];
        assignedSlotId = slot.id;
        assignedSlotNumber = slot.slot_number;
        const slotNotes = `Assigned via Subscription #${subscriptionId}${finalOrderId ? ` (Order #${finalOrderId})` : ''}`;
        const assignedRecipient = cleanEmail || (whatsapp_number ? whatsapp_number.trim() : customer_name.trim());

        await connection.query(`
          UPDATE digital_license_slots SET
            order_id = ?,
            assigned_to = ?,
            customer_name = ?,
            customer_phone = ?,
            start_date = ?,
            end_date = ?,
            status = 'Active',
            notes = ?
          WHERE id = ?
        `, [
          finalOrderId ? parseInt(finalOrderId, 10) : null,
          assignedRecipient,
          customer_name.trim(),
          whatsapp_number.trim(),
          formattedPDate,
          formattedEDate,
          slotNotes,
          assignedSlotId
        ]);

        await connection.query(`
          UPDATE subscriptions SET digital_slot_id = ? WHERE id = ?
        `, [assignedSlotId, subscriptionId]);
      } else {
        console.warn(`No available slots left in digital license account #${parsedAccId} for subscription #${subscriptionId}`);
      }
    }

    // Add initial record in subscription_renewals
    try {
      await connection.query(`
        INSERT INTO subscription_renewals (
          subscription_id, start_date, end_date, validity_days, amount, status, notes,
          customer_notes, admin_notes, license_rules, account_given, digital_account_id, digital_slot_id
        )
        VALUES (?, ?, ?, ?, ?, 'Current', ?, ?, ?, ?, ?, ?, ?)
      `, [
        subscriptionId,
        formattedPDate,
        formattedEDate,
        vDays,
        parseFloat(selling_price) || 0,
        finalAdminNotes || 'Initial purchase',
        finalCustomerNotes,
        finalAdminNotes,
        finalRules || null,
        finalAccountGiven || null,
        parsedAccId || null,
        assignedSlotId || null
      ]);
    } catch (renErr) {
      console.warn('Initial subscription_renewals insert fallback:', renErr.message);
      await connection.query(`
        INSERT INTO subscription_renewals (subscription_id, start_date, end_date, validity_days, amount, status, notes, account_given)
        VALUES (?, ?, ?, ?, ?, 'Current', 'Initial purchase', ?)
      `, [
        subscriptionId,
        formattedPDate,
        formattedEDate,
        vDays,
        parseFloat(selling_price) || 0,
        finalAccountGiven || null
      ]);
    }

    await connection.commit();

    // Trigger Purchase Confirmation Email to customer's email address ONLY if provided and send_email is enabled
    const shouldSendEmail = (send_email === undefined || send_email === null || send_email === true || send_email === 'true' || send_email === 1 || send_email === '1');

    if (finalOrderId && shouldSendEmail && cleanEmail) {
      const { sendPurchaseConfirmationEmail } = require('../services/purchaseEmailService');
      sendPurchaseConfirmationEmail(finalOrderId).catch(emailErr => {
        console.error('Failed to send purchase email for manual subscription order:', emailErr.message);
      });
    }

    // Trigger License Details Email if send_email is enabled, customer email provided, and license key / account credentials OR rules present
    if (shouldSendEmail && cleanEmail && (finalAccountGiven || finalRules)) {
      sendSubscriptionLicenseEmail({
        email: cleanEmail,
        customerName: customer_name,
        productName: product_name,
        packagePlan: package_plan,
        licenseKey: finalAccountGiven,
        rules: finalRules,
        purchaseDate: formattedPDate,
        validityDays: vDays,
        expiryDate: formattedEDate,
        orderId: finalOrderId,
        customerNotes: finalCustomerNotes
      }).catch(mailErr => {
        console.error('Failed to send subscription license email:', mailErr.message);
      });
    }

    res.status(201).json({
      message: 'Customer subscription created successfully and linked to Orders!',
      subscriptionId,
      orderId: finalOrderId
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create subscription error:', err);
    res.status(500).json({ message: err.message || 'Failed to create subscription.' });
  } finally {
    connection.release();
  }
};

exports.updateSubscription = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    whatsapp_number,
    email,
    product_name,
    package_plan,
    customer_source,
    purchase_date,
    validity_days,
    expiry_date,
    account_given,
    license_rules,
    selling_price,
    payment_status,
    status,
    notes,
    customer_notes,
    admin_notes,
    order_id,
    vendor_id,
    vendor_price,
    digital_account_id
  } = req.body;

  try {
    const pool = db.getPool();
    const [subCheck] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    if (subCheck.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }
    const currSub = subCheck[0];

    let cleanEmail = (email && typeof email === 'string' && email.trim()) ? email.trim() : null;
    if (cleanEmail) {
      const [adminEmailCheck] = await pool.query(
        'SELECT id FROM users WHERE role = "admin" AND LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
        [cleanEmail]
      );
      if (adminEmailCheck.length > 0) {
        console.warn(`[updateSubscription] Filtered out admin email '${cleanEmail}' from customer subscription update.`);
        cleanEmail = null;
      }
    }

    const pDate = purchase_date ? new Date(purchase_date).toISOString().slice(0, 10) : undefined;
    const eDate = expiry_date ? new Date(expiry_date).toISOString().slice(0, 10) : undefined;

    // Handle digital license slot assignment / reallocation if digital_account_id is provided
    let newSlotId = currSub.digital_slot_id;
    if (digital_account_id !== undefined) {
      const parsedAccId = digital_account_id ? parseInt(digital_account_id, 10) : null;
      if (parsedAccId && (currSub.digital_account_id !== parsedAccId || !currSub.digital_slot_id)) {
        // Free old slot if any
        if (currSub.digital_slot_id) {
          await pool.query(`
            UPDATE digital_license_slots SET
              order_id = NULL, assigned_to = NULL, customer_name = NULL, customer_phone = NULL,
              start_date = NULL, end_date = NULL, status = 'Available', notes = NULL
            WHERE id = ?
          `, [currSub.digital_slot_id]);
        }

        // Find available slot in newly chosen account
        const [freeSlots] = await pool.query(`
          SELECT id, slot_number FROM digital_license_slots
          WHERE account_id = ? AND (status = 'Available' OR status IS NULL)
          ORDER BY slot_number ASC LIMIT 1
        `, [parsedAccId]);

        if (freeSlots.length > 0) {
          const slot = freeSlots[0];
          newSlotId = slot.id;
          const ordId = order_id !== undefined ? (order_id ? parseInt(order_id, 10) : null) : currSub.order_id;
          const assignedUser = (email && email.trim()) ? email.trim() : (whatsapp_number ? whatsapp_number.trim() : (customer_name ? customer_name.trim() : 'Customer'));
          const slotNotes = `Assigned via Subscription #${id}${ordId ? ` (Order #${ordId})` : ''}`;

          await pool.query(`
            UPDATE digital_license_slots SET
              order_id = ?, assigned_to = ?, customer_name = ?, customer_phone = ?,
              start_date = ?, end_date = ?, status = 'Active', notes = ?
            WHERE id = ?
          `, [
            ordId,
            assignedUser,
            customer_name ? customer_name.trim() : currSub.customer_name,
            whatsapp_number ? whatsapp_number.trim() : currSub.whatsapp_number,
            pDate || currSub.purchase_date,
            eDate || currSub.expiry_date,
            slotNotes,
            slot.id
          ]);
        }
      } else if (!parsedAccId && currSub.digital_slot_id) {
        // Disassociated from digital account: free slot
        await pool.query(`
          UPDATE digital_license_slots SET
            order_id = NULL, assigned_to = NULL, customer_name = NULL, customer_phone = NULL,
            start_date = NULL, end_date = NULL, status = 'Available', notes = NULL
          WHERE id = ?
        `, [currSub.digital_slot_id]);
        newSlotId = null;
      }
    }

    await pool.query(`
      UPDATE subscriptions SET
        customer_name = COALESCE(?, customer_name),
        whatsapp_number = COALESCE(?, whatsapp_number),
        email = ?,
        product_name = COALESCE(?, product_name),
        package_plan = COALESCE(?, package_plan),
        customer_source = COALESCE(?, customer_source),
        purchase_date = COALESCE(?, purchase_date),
        validity_days = COALESCE(?, validity_days),
        expiry_date = COALESCE(?, expiry_date),
        account_given = ?,
        license_rules = COALESCE(?, license_rules),
        selling_price = COALESCE(?, selling_price),
        payment_status = COALESCE(?, payment_status),
        status = COALESCE(?, status),
        order_id = COALESCE(?, order_id),
        vendor_id = ?,
        vendor_price = COALESCE(?, vendor_price),
        notes = ?,
        customer_notes = ?,
        admin_notes = ?,
        digital_account_id = ?,
        digital_slot_id = ?
      WHERE id = ?
    `, [
      customer_name,
      whatsapp_number,
      email !== undefined ? cleanEmail : null,
      product_name,
      package_plan,
      customer_source,
      pDate,
      validity_days ? parseInt(validity_days) : undefined,
      eDate,
      account_given !== undefined ? account_given : null,
      license_rules !== undefined ? (license_rules ? license_rules.trim() : null) : undefined,
      selling_price !== undefined ? parseFloat(selling_price) : undefined,
      payment_status,
      status,
      order_id !== undefined ? (order_id ? parseInt(order_id, 10) : null) : undefined,
      vendor_id !== undefined ? (vendor_id ? parseInt(vendor_id, 10) : null) : null,
      vendor_price !== undefined && vendor_price !== '' ? parseFloat(vendor_price) : undefined,
      admin_notes !== undefined ? admin_notes : (notes !== undefined ? notes : null),
      customer_notes !== undefined ? customer_notes : null,
      admin_notes !== undefined ? admin_notes : (notes !== undefined ? notes : null),
      digital_account_id !== undefined ? (digital_account_id ? parseInt(digital_account_id, 10) : null) : currSub.digital_account_id,
      newSlotId,
      id
    ]);

    // Sync customer_name, phone, and delivery_email to linked order if order_id exists
    const targetOrderId = (order_id !== undefined && order_id) ? parseInt(order_id, 10) : currSub.order_id;
    if (targetOrderId) {
      try {
        const orderUpdates = [];
        const orderParams = [];
        if (customer_name !== undefined) {
          orderUpdates.push('customer_name = ?');
          orderParams.push(customer_name ? customer_name.trim() : null);
        }
        if (whatsapp_number !== undefined) {
          orderUpdates.push('phone = ?');
          orderParams.push(whatsapp_number ? whatsapp_number.trim() : null);
        }
        if (email !== undefined) {
          orderUpdates.push('delivery_email = ?');
          orderParams.push(cleanEmail || null);
        }
        if (orderUpdates.length > 0) {
          orderParams.push(targetOrderId);
          await pool.query(`UPDATE orders SET ${orderUpdates.join(', ')} WHERE id = ?`, orderParams);
        }
      } catch (ordSyncErr) {
        console.warn('Syncing subscription updates to order failed:', ordSyncErr.message);
      }
    }

    // Sync account_given and digital slot info to Current renewal record
    try {
      const finalAcc = account_given !== undefined ? account_given : currSub.account_given;
      const finalDigitalAcc = digital_account_id !== undefined ? (digital_account_id ? parseInt(digital_account_id, 10) : null) : currSub.digital_account_id;
      await pool.query(`
        UPDATE subscription_renewals
        SET account_given = ?,
            digital_account_id = ?,
            digital_slot_id = ?
        WHERE subscription_id = ? AND status = 'Current'
      `, [finalAcc, finalDigitalAcc, newSlotId, id]);
    } catch (renUpErr) {
      console.warn('Could not sync update to Current renewal:', renUpErr.message);
    }

    res.json({ message: 'Subscription updated successfully!' });
  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ message: 'Failed to update subscription.' });
  }
};

exports.renewSubscription = async (req, res) => {
  const { id } = req.params;
  const {
    renewal_date,
    validity_days,
    new_expiry_date,
    payment_amount,
    notes,
    customer_notes,
    admin_notes,
    package_plan,
    license_id,
    account_given,
    license_rules,
    customer_email
  } = req.body;

  const pool = db.getPool();
  await ensureSubscriptionColumns(pool);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [subCheck] = await connection.query('SELECT * FROM subscriptions WHERE id = ? FOR UPDATE', [id]);
    if (subCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const sub = subCheck[0];
    let rDate = renewal_date ? new Date(renewal_date) : new Date();
    if (isNaN(rDate.getTime())) rDate = new Date();
    const vDays = parseInt(validity_days, 10) || 30;

    let eDate;
    if (new_expiry_date) {
      eDate = new Date(new_expiry_date);
      if (isNaN(eDate.getTime())) {
        eDate = new Date(rDate);
        eDate.setDate(eDate.getDate() + vDays);
      }
    } else {
      eDate = new Date(rDate);
      eDate.setDate(eDate.getDate() + vDays);
    }

    const formattedRDate = rDate.toISOString().slice(0, 10);
    const formattedEDate = eDate.toISOString().slice(0, 10);
    const amount = payment_amount !== undefined && payment_amount !== ''
      ? parseFloat(payment_amount)
      : parseFloat(sub.selling_price || 0);

    let finalAccountGiven = (account_given !== undefined && account_given !== null && account_given.trim() !== '')
      ? account_given.trim()
      : (sub.account_given || '');
    let finalRules = license_rules || '';

    // If a pre-loaded license from stock was chosen, mark it as used and get its details
    if (license_id) {
      const [licRows] = await connection.query(
        'SELECT id, license_key, rules FROM product_licenses WHERE id = ? AND is_used = 0 FOR UPDATE',
        [license_id]
      );
      if (licRows.length > 0) {
        finalAccountGiven = licRows[0].license_key;
        if (licRows[0].rules) {
          finalRules = licRows[0].rules;
        }
        await connection.query(
          'UPDATE product_licenses SET is_used = 1, used_at = NOW() WHERE id = ?',
          [license_id]
        );
      }
    }

    let targetEmail = (customer_email !== undefined && customer_email !== null && customer_email.trim() !== '')
      ? customer_email.trim()
      : (sub.email || '').trim();

    if (targetEmail) {
      const [adminEmailCheck] = await connection.query(
        'SELECT id FROM users WHERE role = "admin" AND LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
        [targetEmail]
      );
      if (adminEmailCheck.length > 0) {
        console.warn(`[renewSubscription] Filtered out admin email '${targetEmail}' from renewal.`);
        targetEmail = null;
      }
    }

    const finalCustomerNotes = customer_notes !== undefined ? (customer_notes ? customer_notes.trim() : null) : null;
    const finalAdminNotes = admin_notes !== undefined 
      ? (admin_notes ? admin_notes.trim() : null) 
      : (notes ? notes.trim() : null);

    // Try logging into subscription_renewals if table exists
    try {
      await connection.query('UPDATE subscription_renewals SET status = "Previous" WHERE subscription_id = ?', [id]);
      await connection.query(`
        INSERT INTO subscription_renewals (
          subscription_id, start_date, end_date, validity_days, amount, status, notes,
          customer_notes, admin_notes, license_rules, account_given, digital_account_id, digital_slot_id
        )
        VALUES (?, ?, ?, ?, ?, 'Current', ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        formattedRDate,
        formattedEDate,
        vDays,
        amount,
        finalAdminNotes || 'Subscription renewed',
        finalCustomerNotes,
        finalAdminNotes,
        finalRules || null,
        finalAccountGiven || null,
        sub.digital_account_id || null,
        sub.digital_slot_id || null
      ]);
    } catch (renErr) {
      console.warn('Skipping subscription_renewals log:', renErr.message);
    }

    // Update main subscription record
    await connection.query(`
      UPDATE subscriptions SET
        purchase_date = ?,
        validity_days = ?,
        expiry_date = ?,
        selling_price = ?,
        package_plan = COALESCE(?, package_plan),
        account_given = ?,
        license_rules = COALESCE(?, license_rules),
        email = COALESCE(?, email),
        customer_notes = COALESCE(?, customer_notes),
        admin_notes = COALESCE(?, admin_notes),
        payment_status = 'Paid',
        status = 'Renewed',
        updated_at = NOW()
      WHERE id = ?
    `, [
      formattedRDate,
      vDays,
      formattedEDate,
      amount,
      package_plan || null,
      finalAccountGiven || null,
      finalRules || null,
      targetEmail || null,
      finalCustomerNotes !== null ? finalCustomerNotes : null,
      finalAdminNotes !== null ? finalAdminNotes : null,
      id
    ]);

    await connection.commit();

    // Send renewal confirmation email if customer email exists
    let emailDispatched = false;
    if (targetEmail) {
      sendSubscriptionRenewalEmail({
        email: targetEmail,
        customerName: sub.customer_name,
        productName: sub.product_name,
        packagePlan: package_plan || sub.package_plan,
        licenseKey: finalAccountGiven,
        rules: finalRules,
        renewalDate: formattedRDate,
        validityDays: vDays,
        expiryDate: formattedEDate,
        amount: amount,
        orderId: sub.order_id,
        subscriptionId: id,
        customerNotes: finalCustomerNotes
      }).then(sent => {
        console.log(`[Subscription Renewal] Confirmation email sent to ${targetEmail}:`, sent);
      }).catch(mailErr => {
        console.error('[Subscription Renewal] Failed to send renewal confirmation email:', mailErr.message);
      });
      emailDispatched = true;
    }

    let responseMessage = `Subscription for ${sub.customer_name} renewed successfully until ${formattedEDate}!`;
    if (emailDispatched) {
      responseMessage += ` Renewal confirmation email sent to ${targetEmail}.`;
    }

    res.json({
      message: responseMessage,
      emailSent: emailDispatched,
      email: targetEmail,
      newExpiryDate: formattedEDate
    });
  } catch (err) {
    await connection.rollback();
    console.error('Renew subscription error:', err);
    res.status(500).json({ message: err.message || 'Failed to renew subscription.' });
  } finally {
    connection.release();
  }
};

exports.deleteSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    // If a digital slot is assigned, release it back to 'Available'
    const [subRows] = await pool.query('SELECT digital_slot_id FROM subscriptions WHERE id = ?', [id]);
    if (subRows.length > 0 && subRows[0].digital_slot_id) {
      await pool.query(`
        UPDATE digital_license_slots SET
          order_id = NULL,
          assigned_to = NULL,
          customer_name = NULL,
          customer_phone = NULL,
          start_date = NULL,
          end_date = NULL,
          status = 'Available',
          notes = NULL
        WHERE id = ?
      `, [subRows[0].digital_slot_id]);
    }

    await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    res.json({ message: 'Subscription deleted successfully.' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ message: 'Failed to delete subscription.' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM subscription_settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  const settingsObj = req.body;
  if (!settingsObj || typeof settingsObj !== 'object') {
    return res.status(400).json({ message: 'Invalid settings payload.' });
  }

  const pool = db.getPool();
  try {
    for (const [key, value] of Object.entries(settingsObj)) {
      await pool.query(
        'INSERT INTO subscription_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Subscription settings updated successfully!' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings.' });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const validStatuses = ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled', 'Not Renewed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Valid values are: ${validStatuses.join(', ')}` });
  }

  try {
    const pool = db.getPool();
    const [subCheck] = await pool.query('SELECT id, status, customer_name FROM subscriptions WHERE id = ?', [id]);
    if (subCheck.length === 0) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    await pool.query('UPDATE subscriptions SET status = ? WHERE id = ?', [status, id]);

    res.json({
      message: `Subscription status updated to "${status}".`,
      id: parseInt(id, 10),
      status
    });
  } catch (err) {
    console.error('Update subscription status error:', err);
    res.status(500).json({ message: 'Failed to update subscription status.' });
  }
};

exports.getNoteTemplates = async (req, res) => {
  try {
    const pool = db.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_note_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await pool.query('SELECT * FROM subscription_note_templates ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get note templates error:', err);
    res.status(500).json({ message: 'Failed to fetch note templates.' });
  }
};

exports.createNoteTemplate = async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Template title is required.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Template content is required.' });
  }

  try {
    const pool = db.getPool();
    const [result] = await pool.query(
      'INSERT INTO subscription_note_templates (title, content, category) VALUES (?, ?, ?)',
      [title.trim(), content.trim(), category || 'customer']
    );

    res.status(201).json({
      message: 'Template created successfully!',
      template: {
        id: result.insertId,
        title: title.trim(),
        content: content.trim(),
        category: category || 'customer'
      }
    });
  } catch (err) {
    console.error('Create note template error:', err);
    res.status(500).json({ message: 'Failed to create note template.' });
  }
};

exports.updateNoteTemplate = async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Template title is required.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Template content is required.' });
  }

  try {
    const pool = db.getPool();
    const [check] = await pool.query('SELECT id FROM subscription_note_templates WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ message: 'Template not found.' });
    }

    await pool.query(
      'UPDATE subscription_note_templates SET title = ?, content = ?, category = COALESCE(?, category) WHERE id = ?',
      [title.trim(), content.trim(), category || null, id]
    );

    res.json({ message: 'Template updated successfully!' });
  } catch (err) {
    console.error('Update note template error:', err);
    res.status(500).json({ message: 'Failed to update note template.' });
  }
};

exports.deleteNoteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    const [check] = await pool.query('SELECT id FROM subscription_note_templates WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ message: 'Template not found.' });
    }

    await pool.query('DELETE FROM subscription_note_templates WHERE id = ?', [id]);
    res.json({ message: 'Template deleted successfully!' });
  } catch (err) {
    console.error('Delete note template error:', err);
    res.status(500).json({ message: 'Failed to delete note template.' });
  }
};
