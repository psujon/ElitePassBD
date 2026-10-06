const express = require('express');
const router = express.Router();
const digitalLicenseController = require('../controllers/digitalLicenseController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', digitalLicenseController.getAllAccounts);
router.get('/summary/stats', digitalLicenseController.getStatsSummary);
router.get('/order-lookup/:orderId', digitalLicenseController.lookupOrder);
router.get('/orders/recent', digitalLicenseController.getRecentOrders);
router.get('/:id', digitalLicenseController.getAccountById);
router.post('/', digitalLicenseController.createAccount);
router.put('/:id', digitalLicenseController.updateAccount);
router.delete('/:id', digitalLicenseController.deleteAccount);

router.put('/:accountId/slots/:slotId', digitalLicenseController.assignSlot);
router.delete('/:accountId/slots/:slotId', digitalLicenseController.unassignSlot);

module.exports = router;
