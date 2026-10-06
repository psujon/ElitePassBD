const express = require('express');
const router = express.Router();
const productUsageRulesController = require('../controllers/productUsageRulesController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', productUsageRulesController.getAllRules);
router.get('/by-product/:productId', productUsageRulesController.getRulesByProductId);
router.get('/:id', productUsageRulesController.getRuleById);
router.post('/', productUsageRulesController.createRule);
router.put('/:id', productUsageRulesController.updateRule);
router.delete('/:id', productUsageRulesController.deleteRule);

module.exports = router;
