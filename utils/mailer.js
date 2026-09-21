const nodemailer = require('nodemailer');

const sendEmailDetailed = async ({ to, subject, text, html, attachments }) => {
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

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'ElitePassBD'}" <${smtpUser}>`,
        to,
        subject,
        text,
        html
      };

      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(`[Mailer] SMTP credentials not configured in .env. Skipping email to ${to}`);
      return { success: false, error: 'SMTP credentials not configured in .env' };
    }
  } catch (err) {
    console.error(`[Mailer Error] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Standard sendEmail returning boolean (true / false) for 100% backward compatibility
const sendEmail = async (options) => {
  const result = await sendEmailDetailed(options);
  return !!(result && result.success);
};

module.exports = {
  sendEmail,
  sendEmailDetailed
};
