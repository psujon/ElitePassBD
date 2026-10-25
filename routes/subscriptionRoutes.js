const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeAdmin);

// Safe helper to prevent server crash if controller methods are missing during deployment
const safe = (fn, name) => {
  if (typeof fn === 'function') return fn;
  return (req, res) => {
    console.error(`[subscriptionRoutes] Method ${name} is undefined. Ensure controllers/subscriptionController.js is uploaded.`);
    res.status(501).json({ message: `Endpoint ${name} is not available on this server. Please upload controllers/subscriptionController.js and restart.` });
  };
};

router.get('/', safe(subscriptionController.getAllSubscriptions, 'getAllSubscriptions'));
router.post('/', safe(subscriptionController.createSubscription, 'createSubscription'));
router.get('/settings', safe(subscriptionController.getSettings, 'getSettings'));
router.put('/settings', safe(subscriptionController.updateSettings, 'updateSettings'));

router.get('/note-templates', safe(subscriptionController.getNoteTemplates, 'getNoteTemplates'));
router.post('/note-templates', safe(subscriptionController.createNoteTemplate, 'createNoteTemplate'));
router.put('/note-templates/:id', safe(subscriptionController.updateNoteTemplate, 'updateNoteTemplate'));
router.delete('/note-templates/:id', safe(subscriptionController.deleteNoteTemplate, 'deleteNoteTemplate'));

router.get('/:id', safe(subscriptionController.getSubscriptionById, 'getSubscriptionById'));
router.put('/:id', safe(subscriptionController.updateSubscription, 'updateSubscription'));
router.patch('/:id/status', safe(subscriptionController.updateSubscriptionStatus, 'updateSubscriptionStatus'));
router.put('/:id/status', safe(subscriptionController.updateSubscriptionStatus, 'updateSubscriptionStatus'));
router.post('/:id/renew', safe(subscriptionController.renewSubscription, 'renewSubscription'));
router.delete('/:id', safe(subscriptionController.deleteSubscription, 'deleteSubscription'));

module.exports = router;
