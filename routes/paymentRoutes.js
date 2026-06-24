const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Initiate checkout (public endpoint to support both registered and guest checkouts)
router.post('/initiate', paymentController.initiatePayment);

// Callback redirect endpoints triggered by EPS gateway
router.get('/success', paymentController.paymentSuccess);
router.get('/fail', paymentController.paymentFail);
router.get('/cancel', paymentController.paymentCancel);

// IPN Webhook endpoint
router.post('/ipn', paymentController.paymentIpn);

// Debug endpoint for EPS connection
router.get('/test-eps', paymentController.testEpsConnection);

module.exports = router;
