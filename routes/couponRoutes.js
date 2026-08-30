const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.post('/apply', couponController.applyCoupon);

router.get('/', authenticateToken, authorizeAdmin, couponController.getAllCoupons);
router.post('/', authenticateToken, authorizeAdmin, couponController.createCoupon);
router.put('/:id', authenticateToken, authorizeAdmin, couponController.updateCoupon);
router.put('/:id/status', authenticateToken, authorizeAdmin, couponController.toggleCouponStatus);
router.delete('/:id', authenticateToken, authorizeAdmin, couponController.deleteCoupon);

module.exports = router;
