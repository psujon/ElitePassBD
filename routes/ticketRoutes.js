const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.post('/', ticketController.createTicket);

router.get('/my-tickets', authenticateToken, ticketController.getMyTickets);

router.get('/', authenticateToken, authorizeAdmin, ticketController.getAllTickets);
router.get('/stats', authenticateToken, authorizeAdmin, ticketController.getTicketStats);
router.put('/:id/status', authenticateToken, authorizeAdmin, ticketController.updateTicketStatus);

module.exports = router;
