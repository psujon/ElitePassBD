const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Get all slides
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM slides ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch slides error:', err);
    res.status(500).json({ message: 'Failed to fetch slides.' });
  }
});

// Add a slide (Admin)
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  const { image_url } = req.body;
  if (!image_url) {
    return res.status(400).json({ message: 'Image URL is required.' });
  }
  try {
    const [result] = await db.query('INSERT INTO slides (image_url) VALUES (?)', [image_url]);
    res.status(201).json({ id: result.insertId, image_url });
  } catch (err) {
    console.error('Create slide error:', err);
    res.status(500).json({ message: 'Failed to create slide.' });
  }
});

// Delete a slide (Admin)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM slides WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slide not found.' });
    }
    res.json({ message: 'Slide deleted successfully.' });
  } catch (err) {
    console.error('Delete slide error:', err);
    res.status(500).json({ message: 'Failed to delete slide.' });
  }
});

module.exports = router;
