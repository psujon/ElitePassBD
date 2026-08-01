const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.post('/', authenticateToken, orderController.createOrder);
router.post('/guest', orderController.createGuestOrder);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/track/:id', authenticateToken, orderController.trackOrder);

router.get('/', authenticateToken, authorizeAdmin, orderController.getAllOrders);
router.put('/:id/status', authenticateToken, authorizeAdmin, orderController.updateOrderStatus);
router.delete('/:id', authenticateToken, authorizeAdmin, orderController.deleteOrder);

module.exports = router;
