const express = require('express');
const router = express.Router();
const pageSectionController = require('../controllers/pageSectionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public route: fetch active sections for a specific page by key (about, partners, privacy, terms, refund, dmca)
router.get('/:pageKey', pageSectionController.getSectionsByPageKey);

// Protected Admin routes
router.get('/admin/all', authenticateToken, authorizeAdmin, pageSectionController.getAllAdminSections);
router.post('/', authenticateToken, authorizeAdmin, pageSectionController.createSection);
router.put('/reorder/batch', authenticateToken, authorizeAdmin, pageSectionController.reorderSections);
router.put('/:id', authenticateToken, authorizeAdmin, pageSectionController.updateSection);
router.delete('/:id', authenticateToken, authorizeAdmin, pageSectionController.deleteSection);

module.exports = router;

