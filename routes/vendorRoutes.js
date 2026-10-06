const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Protect all vendor routes for authenticated administrators only
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/stats', vendorController.getVendorStats);
router.get('/', vendorController.getAllVendors);
router.post('/', vendorController.createVendor);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
