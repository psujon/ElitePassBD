const db = require('../config/db');

/**
 * Convert Bengali digits (০-৯) to English digits (0-9)
 */
const convertBengaliDigits = (str) => {
  if (!str) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[০-৯]/g, d => bn.indexOf(d));
};

/**
 * Parses package duration strings (e.g. "18 Month", "1 Year", "14 Days", "6 Months - Personal Mail")
 * Returns structured duration information.
 */
const parsePackageDuration = (packageStr, productPackagesJson = null) => {
  let str = (packageStr || '').trim();

  // If empty or generic, try extracting duration from product's packages JSON
  if ((!str || str.toLowerCase() === 'standard plan' || str.toLowerCase() === 'default') && productPackagesJson) {
    try {
      const pkgs = typeof productPackagesJson === 'string' ? JSON.parse(productPackagesJson) : productPackagesJson;
      if (Array.isArray(pkgs) && pkgs.length > 0 && pkgs[0].duration) {
        str = pkgs[0].duration;
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  // Convert Bengali numerals if any
  const normalized = convertBengaliDigits(str).toLowerCase().trim();

  // 1. Lifetime / আজীবন
  if (normalized.includes('lifetime') || normalized.includes('lifetim') || normalized.includes('life time') || normalized.includes('আজীবন')) {
    return { type: 'year', value: 10, days: 3650 };
  }

  // 2. Years (e.g. "1 Year", "2 Years", "1yr", "2y", "১ বছর", "২ বছর")
  const yearMatch = normalized.match(/(\d+)\s*(year|yr|y|বছরের|বছর|বৎসরের)/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y > 0) return { type: 'year', value: y, days: y * 365 };
  }

  // 3. Months (e.g. "18 Month", "18 Months", "18m", "1 Month", "6 Month", "১২ মাস", "১৮ মাস")
  const monthMatch = normalized.match(/(\d+)\s*(month|mon|m|মাসের|মাস)/);
  if (monthMatch) {
    const m = parseInt(monthMatch[1], 10);
    if (m > 0) return { type: 'month', value: m, days: m * 30 };
  }

  // 4. Weeks (e.g. "2 Weeks", "1 Week", "২ সপ্তাহ")
  const weekMatch = normalized.match(/(\d+)\s*(week|w|সপ্তাহ)/);
  if (weekMatch) {
    const w = parseInt(weekMatch[1], 10);
    if (w > 0) return { type: 'day', value: w * 7, days: w * 7 };
  }

  // 5. Days (e.g. "14 Days", "7 Day", "60d", "১৪ দিন", "৭ দিন")
  const dayMatch = normalized.match(/(\d+)\s*(day|d|দিনের|দিন)/);
  if (dayMatch) {
    const d = parseInt(dayMatch[1], 10);
    if (d > 0) return { type: 'day', value: d, days: d };
  }

  // 6. Keywords fallback
  if (normalized.includes('half yearly') || normalized.includes('half-year')) {
    return { type: 'month', value: 6, days: 180 };
  }
  if (normalized.includes('quarterly') || normalized.includes('quarter')) {
    return { type: 'month', value: 3, days: 90 };
  }
  if (normalized.includes('yearly') || normalized.includes('annual')) {
    return { type: 'year', value: 1, days: 365 };
  }
  if (normalized.includes('monthly')) {
    return { type: 'month', value: 1, days: 30 };
  }
  if (normalized.includes('weekly')) {
    return { type: 'day', value: 7, days: 7 };
  }

  // 7. Pure number fallback (e.g. "18" -> 18 months, "90" -> 90 days)
  const numMatch = normalized.match(/^(\d+)$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n <= 36) {
      return { type: 'month', value: n, days: n * 30 };
    } else if (n > 36) {
      return { type: 'day', value: n, days: n };
    }
  }

  // Default: 1 month (30 days)
  return { type: 'month', value: 1, days: 30 };
};

/**
 * Calculates purchase date, expiry date, validity days, and initial status based on duration and base date.
 */
const calculateSubscriptionDates = (durationInfo, baseDateVal = new Date()) => {
  let pDate = new Date(baseDateVal);
  if (isNaN(pDate.getTime())) pDate = new Date();

  const eDate = new Date(pDate);

  if (durationInfo.type === 'year') {
    eDate.setFullYear(eDate.getFullYear() + durationInfo.value);
  } else if (durationInfo.type === 'month') {
    eDate.setMonth(eDate.getMonth() + durationInfo.value);
  } else if (durationInfo.type === 'day') {
    eDate.setDate(eDate.getDate() + durationInfo.value);
  }

  // Calculate actual day count difference
  const actualDays = Math.round((eDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)) || durationInfo.days || 30;

  const formattedPDate = pDate.toISOString().slice(0, 10);
  const formattedEDate = eDate.toISOString().slice(0, 10);

  const todayStr = new Date().toISOString().slice(0, 10);
  let status = 'Active';
  if (formattedEDate < todayStr) {
    status = 'Expired';
  } else {
    const diffDays = Math.ceil((new Date(formattedEDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      status = 'Expiring Soon';
    }
  }

  return {
    purchaseDateStr: formattedPDate,
    expiryDateStr: formattedEDate,
    validityDays: actualDays,
    status
  };
};

/**
 * Automatically creates or updates subscription records for a delivered website order.
 * Ensures the exact package duration (e.g. 18 Month, 1 Year, etc.) is respected.
 */
const syncWebsiteOrderToSubscriptions = async (orderId, connection = null) => {
  const conn = connection || db.getPool();
  if (!conn) return;

  try {
    // 1. Fetch order details
    const [orders] = await conn.query(`
      SELECT o.id, o.phone, o.delivery_email, o.created_at, o.completed_at,
             u.name AS user_name, u.email AS user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) return;
    const ord = orders[0];

    const customerName = ord.user_name || 'Website Customer';
    const customerPhone = ord.phone || '';
    const customerEmail = ord.delivery_email || ord.user_email || null;
    const purchaseDate = ord.created_at ? new Date(ord.created_at) : new Date();

    // 2. Fetch order items
    const [orderItems] = await conn.query(`
      SELECT oi.id, oi.product_id, oi.price, oi.package_name, oi.selected_device, oi.selected_activation,
             p.name AS product_name, p.packages AS product_packages
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    for (const item of orderItems) {
      // 3. Fetch assigned licenses if any
      const [licRows] = await conn.query(`
        SELECT license_key, rules FROM product_licenses WHERE order_item_id = ?
      `, [item.id]);

      let accountGiven = '';
      let licenseRules = '';
      if (licRows.length > 0) {
        accountGiven = licRows.map(l => l.license_key).filter(Boolean).join(', ');
        licenseRules = licRows.map(l => l.rules).filter(Boolean).join('\n');
      }
      if (!accountGiven) {
        accountGiven = [item.selected_activation, item.selected_device].filter(Boolean).join(' | ') || null;
      }

      // 4. Parse duration and compute dates
      const pkgPlan = item.package_name || 'Standard Plan';
      const durationInfo = parsePackageDuration(pkgPlan, item.product_packages);
      const { purchaseDateStr, expiryDateStr, validityDays, status } = calculateSubscriptionDates(durationInfo, purchaseDate);

      // 5. Check if subscription already exists for this order item
      const [existing] = await conn.query(`
        SELECT id, validity_days, expiry_date FROM subscriptions WHERE order_id = ? AND product_name = ?
      `, [orderId, item.product_name]);

      if (existing.length === 0) {
        // Create new subscription record
        const [subRes] = await conn.query(`
          INSERT INTO subscriptions (
            customer_name, whatsapp_number, email, product_name, package_plan,
            customer_source, purchase_date, validity_days, expiry_date, account_given,
            selling_price, payment_status, status, notes, order_id
          ) VALUES (?, ?, ?, ?, ?, 'Website', ?, ?, ?, ?, ?, 'Paid', ?, ?, ?)
        `, [
          customerName,
          customerPhone,
          customerEmail,
          item.product_name,
          pkgPlan,
          purchaseDateStr,
          validityDays,
          expiryDateStr,
          accountGiven,
          parseFloat(item.price) || 0,
          status,
          licenseRules || 'Website order auto-entry',
          orderId
        ]);

        const subId = subRes.insertId;

        await conn.query(`
          INSERT INTO subscription_renewals (subscription_id, start_date, end_date, validity_days, amount, status, notes)
          VALUES (?, ?, ?, ?, ?, 'Current', 'Initial purchase (Website Order)')
        `, [subId, purchaseDateStr, expiryDateStr, validityDays, parseFloat(item.price) || 0]);

        console.log(`[OrderSubscriptionSync] Created subscription #${subId} for Order #${orderId} (${item.product_name} - ${pkgPlan}): validity ${validityDays} days, Expiry: ${expiryDateStr}`);
      } else {
        // Recalibrate if previously saved with flawed 1-month duration
        const sub = existing[0];
        if (durationInfo.days > 35 && sub.validity_days <= 31) {
          await conn.query(`
            UPDATE subscriptions
            SET validity_days = ?, expiry_date = ?, status = ?,
                account_given = IFNULL(account_given, ?)
            WHERE id = ?
          `, [validityDays, expiryDateStr, status, accountGiven, sub.id]);

          await conn.query(`
            UPDATE subscription_renewals
            SET validity_days = ?, end_date = ?
            WHERE subscription_id = ? AND status = 'Current'
          `, [validityDays, expiryDateStr, sub.id]);

          console.log(`[OrderSubscriptionSync] Repaired subscription #${sub.id} for Order #${orderId}: updated validity to ${validityDays} days, Expiry: ${expiryDateStr}`);
        }
      }
    }
  } catch (err) {
    console.error(`[OrderSubscriptionSync] Error syncing order #${orderId}:`, err.message);
  }
};

/**
 * Repairs existing subscriptions that were saved with 1-month (30 days) expiry
 * when the package plan clearly specified a longer duration (e.g. 18 Month, 12 Month, 1 Year).
 */
const repairAllWebsiteSubscriptions = async (pool = null) => {
  const p = pool || db.getPool();
  if (!p) return;

  try {
    const [subs] = await p.query(`
      SELECT s.id, s.package_plan, s.purchase_date, s.validity_days, s.expiry_date, s.order_id
      FROM subscriptions s
      WHERE s.package_plan IS NOT NULL
        AND s.purchase_date IS NOT NULL
    `);

    for (const sub of subs) {
      const durationInfo = parsePackageDuration(sub.package_plan);
      // If duration is more than 35 days (e.g. 18 Month = 540 days) but validity_days is <= 31 days
      if (durationInfo.days > 35 && sub.validity_days <= 31) {
        const { expiryDateStr, validityDays, status } = calculateSubscriptionDates(durationInfo, sub.purchase_date);

        await p.query(`
          UPDATE subscriptions
          SET validity_days = ?, expiry_date = ?, status = ?
          WHERE id = ?
        `, [validityDays, expiryDateStr, status, sub.id]);

        await p.query(`
          UPDATE subscription_renewals
          SET validity_days = ?, end_date = ?
          WHERE subscription_id = ? AND status = 'Current'
        `, [validityDays, expiryDateStr, sub.id]);

        console.log(`[Subscription Auto-Repair] Repaired subscription #${sub.id} (${sub.package_plan}): ${sub.validity_days}d -> ${validityDays}d, Expiry: ${expiryDateStr}`);
      }
    }
  } catch (err) {
    console.error('[Subscription Auto-Repair] Error repairing expiries:', err.message);
  }
};

module.exports = {
  parsePackageDuration,
  calculateSubscriptionDates,
  syncWebsiteOrderToSubscriptions,
  repairAllWebsiteSubscriptions
};
