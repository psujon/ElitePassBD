const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Require authentication and admin role for all license endpoints
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', licenseController.getAllLicenses);
router.post('/', licenseController.createLicense);
router.delete('/:id', licenseController.deleteLicense);

module.exports = router;
