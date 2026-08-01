const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/initiate', paymentController.initiatePayment);

router.get('/success', paymentController.paymentSuccess);
router.get('/fail', paymentController.paymentFail);
router.get('/cancel', paymentController.paymentCancel);

router.post('/ipn', paymentController.paymentIpn);

const { authorizeAdmin } = require('../middleware/auth');
router.get('/history', authenticateToken, authorizeAdmin, paymentController.getEpsHistory);

router.get('/test-eps', paymentController.testEpsConnection);

module.exports = router;
