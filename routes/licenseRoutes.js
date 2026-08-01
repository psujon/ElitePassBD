const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', licenseController.getAllLicenses);
router.post('/', licenseController.createLicense);
router.put('/:id', licenseController.updateLicense);
router.delete('/:id', licenseController.deleteLicense);

module.exports = router;
