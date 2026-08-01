const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, optionalAuth, authorizeAdmin } = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getAllCategories);
router.get('/reviews/latest', productController.getLatestReviews);
router.get('/:id', productController.getProductById);
router.get('/:productId/reviews', productController.getProductReviews);

router.post('/:productId/reviews', optionalAuth, productController.addOrUpdateReview);

router.get('/:productId/my-review', authenticateToken, productController.getUserReviewForProduct);

router.post('/categories', authenticateToken, authorizeAdmin, productController.createCategory);
router.put('/categories/:id', authenticateToken, authorizeAdmin, productController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeAdmin, productController.deleteCategory);

router.post('/', authenticateToken, authorizeAdmin, productController.createProduct);
router.put('/:id', authenticateToken, authorizeAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, authorizeAdmin, productController.deleteProduct);

module.exports = router;
