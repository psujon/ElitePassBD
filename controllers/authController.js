const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_elitepass_bd';

// Register User
exports.register = async (req, res) => {
  const { name, email, password, whatsappNumber, address } = req.body;

  if (!name || !email || !password || !whatsappNumber || !address) {
    return res.status(400).json({ message: 'All fields (name, email, password, whatsappNumber, address) are required.' });
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
      'INSERT INTO users (name, email, password, role, whatsapp_number, address) VALUES (?, ?, ?, "user", ?, ?)',
      [name, email, hashedPassword, whatsappNumber, address]
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
        whatsapp_number: user.whatsapp_number,
        address: user.address
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
    const [users] = await db.query('SELECT id, name, email, role, whatsapp_number, address, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Database error occurred while fetching profile.' });
  }
};

const nodemailer = require('nodemailer');

// Helper to send email
const sendOTPEmail = async (email, otp) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'ElitePassBD'}" <${smtpUser}>`,
        to: email,
        subject: 'Password Reset OTP - ElitePassBD',
        text: `Your OTP for resetting password is ${otp}. It will expire in 10 minutes.`,
        html: `<h3>Password Reset Requested</h3>
               <p>Your OTP code to reset your password is: <strong>${otp}</strong></p>
               <p>This code will expire in 10 minutes.</p>
               <p>If you did not request this, please ignore this email.</p>`
      });
      console.log(`OTP Email sent successfully to ${email}`);
    } else {
      console.log('----------------------------');
      console.log(`MOCK SMTP: OTP for ${email} is ${otp}`);
      console.log('----------------------------');
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    console.log('----------------------------');
    console.log(`FALLBACK: OTP for ${email} is ${otp}`);
    console.log('----------------------------');
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
    await db.query(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ message: 'An OTP has been sent to your email address.' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ message: 'Database error occurred during password reset request.' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const [resets] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (resets.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({ message: 'Database error occurred during OTP verification.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const [resets] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (resets.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Database error occurred during password reset.' });
  }
};
