const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// User specific order routes
router.post('/', authenticateToken, orderController.createOrder);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/track/:id', authenticateToken, orderController.trackOrder);

// Admin specific order routes
router.get('/', authenticateToken, authorizeAdmin, orderController.getAllOrders);
router.put('/:id/status', authenticateToken, authorizeAdmin, orderController.updateOrderStatus);

module.exports = router;
