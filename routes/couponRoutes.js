const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/apply', couponController.applyCoupon);

router.get('/', verifyToken, isAdmin, couponController.getAllCoupons);
router.post('/', verifyToken, isAdmin, couponController.createCoupon);
router.put('/:id/status', verifyToken, isAdmin, couponController.toggleCouponStatus);
router.delete('/:id', verifyToken, isAdmin, couponController.deleteCoupon);

module.exports = router;
