const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_elitepass_bd';

// Register User
exports.register = async (req, res) => {
  const { name, email, password, whatsappNumber } = req.body;

  if (!name || !email || !password || !whatsappNumber) {
    return res.status(400).json({ message: 'All fields (name, email, password, whatsappNumber) are required.' });
  }

  try {
    // Check if user already exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    await db.query(
      'INSERT INTO users (name, email, password, role, whatsapp_number) VALUES (?, ?, ?, "user", ?)',
      [name, email, hashedPassword, whatsappNumber]
    );

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Database error occurred during registration.' });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        whatsapp_number: user.whatsapp_number
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Database error occurred during login.' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, whatsapp_number, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching profile.' });
  }
};
