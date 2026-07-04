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
        to,
        subject,
        text,
        html
      });
      console.log(`Email sent successfully to ${to}`);
      return true;
    } else {
      console.log('----------------------------');
      console.log(`MOCK SMTP Email -> to: [${to}], subject: [${subject}]`);
      console.log('----------------------------');
      return false;
    }
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    return false;
  }
};

module.exports = {
  sendEmail
};
