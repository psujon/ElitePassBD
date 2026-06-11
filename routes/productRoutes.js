const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/reviews/latest', productController.getLatestReviews);
router.get('/:id', productController.getProductById);
router.get('/:productId/reviews', productController.getProductReviews);

// Authenticated reviews routes
router.get('/:productId/my-review', authenticateToken, productController.getUserReviewForProduct);
router.post('/:productId/reviews', authenticateToken, productController.addOrUpdateReview);

// Admin-only routes
router.post('/', authenticateToken, authorizeAdmin, productController.createProduct);
router.put('/:id', authenticateToken, authorizeAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeAdmin, productController.deleteProduct);

module.exports = router;
