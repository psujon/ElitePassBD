const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_elitepass_bd';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


exports.register = async (req, res) => {
  const { name, email, password, whatsappNumber, address } = req.body;

  if (!name || !email || !password || !whatsappNumber || !address) {
    return res.status(400).json({ message: 'All fields (name, email, password, whatsappNumber, address) are required.' });
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

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

exports.googleLogin = async (req, res) => {
  const { credential } = req.body; // This is the access_token from the frontend

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required.' });
  }

  try {
    console.log('Received googleLogin request. Credential length:', credential ? credential.length : 0);
    
    const https = require('https');
    const getGoogleUserInfo = (token) => {
      return new Promise((resolve, reject) => {
        const req = https.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          },
          (response) => {
            let rawData = '';
            response.on('data', (chunk) => { rawData += chunk; });
            response.on('end', () => {
              if (response.statusCode === 200) {
                try {
                  resolve(JSON.parse(rawData));
                } catch (e) {
                  reject(new Error('Failed to parse Google userinfo response.'));
                }
              } else {
                reject(new Error(`Google userinfo fetch failed with status ${response.statusCode}: ${rawData}`));
              }
            });
          }
        );
        req.on('error', (err) => { reject(err); });
      });
    };

    const payload = await getGoogleUserInfo(credential);
    console.log('Google userinfo fetched successfully. Email:', payload.email);
    const { email, name, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not found in Google profile.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, whatsapp_number, address) VALUES (?, ?, ?, "user", "", "")',
        [name, email, hashedPassword]
      );
      
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google Login successful!',
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
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google credential.' });
  }
};


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

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, whatsapp_number, address } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  try {
    // Note: Email address is strictly NOT allowed to be modified by the user
    await db.query(
      'UPDATE users SET name = ?, whatsapp_number = ?, address = ? WHERE id = ?',
      [
        name.trim(),
        whatsapp_number !== undefined ? (whatsapp_number ? String(whatsapp_number).trim() : null) : null,
        address !== undefined ? (address ? String(address).trim() : null) : null,
        userId
      ]
    );

    const [users] = await db.query(
      'SELECT id, name, email, role, whatsapp_number, address, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedUser = users[0];

    const token = jwt.sign(
      { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser,
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Database error occurred while updating profile.' });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Database error occurred while changing password.' });
  }
};

const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText } = require('../utils/mailer');

const sendOTPEmail = async (email, otp) => {
  try {
    const appName = process.env.APP_NAME || 'ElitePassBD';
    const subject = `Password Reset OTP - ${appName}`;
    const text = `Your OTP for resetting your password is: ${otp}. It will expire in 10 minutes. If you did not request this, please ignore this email.${getWhatsAppContactText()}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - ${appName}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .body-wrapper { padding: 0 !important; }
      .banner-header { padding: 24px 16px !important; }
      .banner-header h1 { font-size: 20px !important; }
      .main-content { padding: 20px 14px !important; }
      .otp-box { font-size: 24px !important; letter-spacing: 4px !important; padding: 14px 16px !important; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
  <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0b1120; padding: 20px 8px;">
    <tr>
      <td align="center" style="padding: 10px 4px;">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45); border: 1px solid #334155;">
          
          <!-- Header Banner -->
          <tr>
            <td class="banner-header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); background-color: #059669; color: #ffffff; padding: 26px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.3px;">
                Password Reset Request
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #d1fae5; font-weight: 500;">
                ${appName} Account Security
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="main-content" style="padding: 24px 20px;">
              <p style="font-size: 15px; color: #ffffff; margin-top: 0; font-weight: 600;">
                Hello,
              </p>
              <p style="font-size: 13.5px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
                We received a request to reset the password for your <strong style="color: #ffffff;">${appName}</strong> account. Use the verification code below to complete your password reset:
              </p>

              <!-- OTP Code Display Card -->
              <div style="text-align: center; margin: 24px 0;">
                <div class="otp-box" style="display: inline-block; background-color: #0f172a; border: 2px dashed #10b981; border-radius: 12px; padding: 16px 28px; font-family: Consolas, 'Courier New', monospace; font-size: 30px; font-weight: 800; color: #34d399; letter-spacing: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #f59e0b; font-weight: 600; margin-top: 10px;">
                  ⏱️ This code will expire in 10 minutes
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #0f172a; border-radius: 10px; padding: 14px 16px; border: 1px solid #334155; margin-top: 20px; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                <strong style="color: #ffffff;">Security Alert:</strong> If you did not request a password reset, please ignore this email or change your password if you suspect unauthorized access. Never share this code with anyone.
              </div>

              <div style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5;">
                Thank you for using <strong style="color: #ffffff;">${appName}</strong>.
              </div>

              <!-- WhatsApp Support Contact Box -->
              ${getWhatsAppContactBlock(true)}
            </td>
          </tr>

          <!-- Footer -->
          ${getEmailFooter(appName, true)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const sent = await sendEmail({
      to: email,
      subject,
      text,
      html
    });
    if (sent) {
      console.log(`OTP Email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
  }
};

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
