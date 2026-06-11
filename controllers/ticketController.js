const db = require('../config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_elitepass_bd';

// Create a new support ticket (Public / Guest / Authenticated)
exports.createTicket = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields (name, email, subject, message) are required.' });
  }

  // Attempt to parse user ID if JWT token exists in header
  let userId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Token expired or invalid, ignore and treat as guest
    }
  }

  try {
    await db.query(
      'INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim(), subject.trim(), message.trim()]
    );
    res.status(201).json({ message: 'Support ticket submitted successfully!' });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Database error occurred while submitting support ticket.' });
  }
};

// Get all support tickets (Admin)
exports.getAllTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*, u.name AS user_name 
       FROM support_tickets t 
       LEFT JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    );
    res.json(tickets);
  } catch (error) {
    console.error('Fetch all tickets error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching support tickets.' });
  }
};

// Update support ticket status and remarks (Admin)
exports.updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const validStatuses = ['Pending', 'Resolved', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status value.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE support_tickets SET status = ?, remarks = ? WHERE id = ?',
      [status, remarks || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    res.json({ message: `Support ticket status updated to ${status} successfully!` });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Database error occurred while updating support ticket.' });
  }
};

// Get support ticket statistics (Admin)
exports.getTicketStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT status, COUNT(*) AS count FROM support_tickets GROUP BY status'
    );

    const stats = {
      total: 0,
      pending: 0,
      resolved: 0,
      closed: 0
    };

    rows.forEach(r => {
      const statusKey = r.status.toLowerCase();
      if (statusKey in stats) {
        stats[statusKey] = parseInt(r.count);
      }
      stats.total += parseInt(r.count);
    });

    res.json(stats);
  } catch (error) {
    console.error('Fetch ticket stats error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching ticket stats.' });
  }
};

// Get support tickets for the logged-in user
exports.getMyTickets = async (req, res) => {
  const userId = req.user.id;
  try {
    const [tickets] = await db.query(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(tickets);
  } catch (error) {
    console.error('Fetch my tickets error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching support tickets.' });
  }
};

