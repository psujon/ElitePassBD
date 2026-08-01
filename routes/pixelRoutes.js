const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendFbEvent } = require('../utils/facebookCapi');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_elitepass_bd';

router.post('/track', async (req, res) => {
  const { eventName, eventId, userData = {}, customData = {} } = req.body;

  if (!eventName) {
    return res.status(400).json({ message: 'Event name is required.' });
  }

  try {
    let finalUserData = { ...userData };

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          const [users] = await db.query('SELECT name, email, whatsapp_number FROM users WHERE id = ?', [decoded.id]);
          if (users.length > 0) {
            const dbUser = users[0];
            finalUserData.email = dbUser.email;
            finalUserData.name = dbUser.name;
            if (dbUser.whatsapp_number) {
              finalUserData.phone = dbUser.whatsapp_number;
            }
          }
        }
      } catch (err) {
      }
    }

    await sendFbEvent({
      eventName,
      eventId,
      userData: finalUserData,
      customData,
      req
    });

    res.json({ success: true, message: `Event "${eventName}" received.` });
  } catch (error) {
    console.error('FB Pixel Route Error:', error);
    res.status(500).json({ message: 'Failed to track event.' });
  }
});

module.exports = router;
