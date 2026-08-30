const db = require('../config/db');

exports.applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const amount = parseFloat(cartTotal || 0);

    const [rows] = await db.query(
      'SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1',
      [cleanCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code.' });
    }

    const coupon = rows[0];

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ message: 'This coupon code has expired.' });
    }

    if (coupon.usage_limit !== null && coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'This coupon code has reached its maximum usage limit.' });
    }

    const minOrderAmount = parseFloat(coupon.min_order_amount || 0);
    if (amount < minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ৳${minOrderAmount.toFixed(0)} is required to use this coupon.`
      });
    }

    let discountAmount = 0;
    const discountVal = parseFloat(coupon.discount_value);

    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * discountVal) / 100;
      if (coupon.max_discount_amount && parseFloat(coupon.max_discount_amount) > 0) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
      }
    } else {
      discountAmount = Math.min(discountVal, amount);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, amount - discountAmount);

    res.json({
      success: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: discountVal,
      discountAmount,
      finalTotal,
      message: `Coupon '${coupon.code}' applied successfully! Discount: ৳${discountAmount}`
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Server error while applying coupon code.' });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(coupons);
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching coupons.' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      expires_at
    } = req.body;

    if (!code || discount_value === undefined || discount_value === null || discount_value === '') {
      return res.status(400).json({ message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const [existing] = await db.query('SELECT id FROM coupons WHERE UPPER(code) = ?', [cleanCode]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `Coupon code '${cleanCode}' already exists.` });
    }

    let parsedExpiresAt = null;
    if (expires_at) {
      const d = new Date(expires_at);
      if (!isNaN(d.getTime())) {
        parsedExpiresAt = d;
      }
    }

    const parsedMinOrder = min_order_amount && !isNaN(parseFloat(min_order_amount)) ? parseFloat(min_order_amount) : 0;
    const parsedMaxDiscount = max_discount_amount && !isNaN(parseFloat(max_discount_amount)) ? parseFloat(max_discount_amount) : null;
    const parsedUsageLimit = usage_limit && !isNaN(parseInt(usage_limit)) ? parseInt(usage_limit) : null;
    const parsedDiscountVal = parseFloat(discount_value);

    await db.query(
      `INSERT INTO coupons 
       (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCode,
        discount_type || 'percentage',
        parsedDiscountVal,
        parsedMinOrder,
        parsedMaxDiscount,
        parsedUsageLimit,
        parsedExpiresAt
      ]
    );

    res.status(201).json({ message: `Coupon '${cleanCode}' created successfully!` });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: error.message || 'Database error occurred while creating coupon.' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      expires_at
    } = req.body;

    if (!code || discount_value === undefined || discount_value === null || discount_value === '') {
      return res.status(400).json({ message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const [existing] = await db.query('SELECT id FROM coupons WHERE UPPER(code) = ? AND id != ?', [cleanCode, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `Coupon code '${cleanCode}' is already in use by another coupon.` });
    }

    let parsedExpiresAt = null;
    if (expires_at) {
      const d = new Date(expires_at);
      if (!isNaN(d.getTime())) {
        parsedExpiresAt = d;
      }
    }

    const parsedMinOrder = min_order_amount && !isNaN(parseFloat(min_order_amount)) ? parseFloat(min_order_amount) : 0;
    const parsedMaxDiscount = max_discount_amount && !isNaN(parseFloat(max_discount_amount)) ? parseFloat(max_discount_amount) : null;
    const parsedUsageLimit = usage_limit && !isNaN(parseInt(usage_limit)) ? parseInt(usage_limit) : null;
    const parsedDiscountVal = parseFloat(discount_value);

    await db.query(
      `UPDATE coupons SET 
       code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, 
       max_discount_amount = ?, usage_limit = ?, expires_at = ?
       WHERE id = ?`,
      [
        cleanCode,
        discount_type || 'percentage',
        parsedDiscountVal,
        parsedMinOrder,
        parsedMaxDiscount,
        parsedUsageLimit,
        parsedExpiresAt,
        id
      ]
    );

    res.json({ message: `Coupon '${cleanCode}' updated successfully!` });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: error.message || 'Database error occurred while updating coupon.' });
  }
};

exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query('UPDATE coupons SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    res.json({ message: 'Coupon status updated successfully.' });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({ message: 'Database error occurred while updating coupon status.' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Database error occurred while deleting coupon.' });
  }
};
