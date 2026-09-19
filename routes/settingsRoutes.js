const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public route to fetch public storefront settings (marquee, support contacts, social links)
router.get('/public', async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');

    const settings = {
      marquee_enabled: true,
      marquee_speed: 35,
      marquee_items: [],
      support_whatsapp: '8801925112444',
      support_email: 'info@elitepassbd.com',
      social_facebook: 'https://facebook.com/ElitePassBD',
      social_instagram: 'https://instagram.com/elitepassbd',
      social_youtube: 'https://youtube.com/elitepassbd',
      social_linkedin: 'https://linkedin.com/elitepassbd',
      social_messenger: 'https://m.me/elitepassbd'
    };

    rows.forEach((r) => {
      if (r.setting_key === 'marquee_enabled') {
        settings.marquee_enabled = r.setting_value === 'true' || r.setting_value === true;
      } else if (r.setting_key === 'marquee_speed') {
        settings.marquee_speed = parseInt(r.setting_value, 10) || 35;
      } else if (r.setting_key === 'marquee_items') {
        try {
          settings.marquee_items = JSON.parse(r.setting_value);
        } catch (e) {
          settings.marquee_items = [];
        }
      } else {
        settings[r.setting_key] = r.setting_value;
      }
    });

    res.json(settings);
  } catch (err) {
    console.error('Fetch public settings error:', err);
    res.status(500).json({ message: 'Failed to load public settings.' });
  }
});

// Admin-only: Get all site settings
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Fetch all settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
});

// Admin-only: Update marquee settings
router.put('/marquee', authenticateToken, authorizeAdmin, async (req, res) => {
  const { marquee_enabled, marquee_speed, marquee_items } = req.body;

  if (marquee_items !== undefined && !Array.isArray(marquee_items)) {
    return res.status(400).json({ message: 'marquee_items must be an array.' });
  }

  const pool = db.getPool();
  try {
    const updates = [];

    if (marquee_enabled !== undefined) {
      const enabledStr = marquee_enabled === true || marquee_enabled === 'true' ? 'true' : 'false';
      updates.push(['marquee_enabled', enabledStr]);
    }

    if (marquee_speed !== undefined) {
      const speedNum = Math.max(10, Math.min(120, parseInt(marquee_speed, 10) || 35));
      updates.push(['marquee_speed', String(speedNum)]);
    }

    if (marquee_items !== undefined) {
      updates.push(['marquee_items', JSON.stringify(marquee_items)]);
    }

    for (const [key, val] of updates) {
      await pool.query(
        `INSERT INTO site_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
        [key, val]
      );
    }

    res.json({
      message: 'Marquee announcements updated successfully!',
      marquee_enabled: marquee_enabled === true || marquee_enabled === 'true',
      marquee_speed: marquee_speed ? parseInt(marquee_speed, 10) : 35,
      marquee_items
    });
  } catch (err) {
    console.error('Update marquee settings error:', err);
    res.status(500).json({ message: 'Failed to update marquee settings.' });
  }
});

// Admin-only: Update support and social links
router.put('/support', authenticateToken, authorizeAdmin, async (req, res) => {
  const {
    support_whatsapp,
    support_email,
    social_facebook,
    social_instagram,
    social_youtube,
    social_linkedin,
    social_messenger
  } = req.body;

  const pool = db.getPool();
  try {
    const fields = {
      support_whatsapp,
      support_email,
      social_facebook,
      social_instagram,
      social_youtube,
      social_linkedin,
      social_messenger
    };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        await pool.query(
          `INSERT INTO site_settings (setting_key, setting_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
          [key, String(val).trim()]
        );
      }
    }

    res.json({
      message: 'Support and social links updated successfully!',
      ...fields
    });
  } catch (err) {
    console.error('Update support settings error:', err);
    res.status(500).json({ message: 'Failed to update support settings.' });
  }
});

module.exports = router;
