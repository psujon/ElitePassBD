const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public route to submit a ticket (guests/users)
router.post('/', ticketController.createTicket);

// User support tickets route
router.get('/my-tickets', authenticateToken, ticketController.getMyTickets);

// Admin-only routes for support tickets management
router.get('/', authenticateToken, authorizeAdmin, ticketController.getAllTickets);
router.get('/stats', authenticateToken, authorizeAdmin, ticketController.getTicketStats);
router.put('/:id/status', authenticateToken, authorizeAdmin, ticketController.updateTicketStatus);

module.exports = router;
