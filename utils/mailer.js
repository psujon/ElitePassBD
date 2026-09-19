const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort == 465,
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
        to,
        subject,
        text,
        html
      });
      return true;
    } else {
      console.warn(`[Mailer] SMTP credentials not configured in .env. Skipping email to ${to}`);
      return false;
    }
  } catch (err) {
    console.error(`[Mailer Error] Failed to send email to ${to}:`, err.message);
    return false;
  }
};

module.exports = {
  sendEmail
};
