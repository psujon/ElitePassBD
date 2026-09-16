const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', subscriptionController.getAllSubscriptions);
router.post('/', subscriptionController.createSubscription);
router.get('/settings', subscriptionController.getSettings);
router.put('/settings', subscriptionController.updateSettings);

router.get('/:id', subscriptionController.getSubscriptionById);
router.put('/:id', subscriptionController.updateSubscription);
router.post('/:id/renew', subscriptionController.renewSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
