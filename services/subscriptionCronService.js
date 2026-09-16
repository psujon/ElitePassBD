const cron = require('node-cron');
const db = require('../config/db');
const { sendEmail } = require('../utils/mailer');
const { replaceTemplateTags, sendWhatsAppCloudApi } = require('./whatsappService');

const getSettingsMap = async (pool) => {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM subscription_settings');
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
};

const formatDateStr = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  return d.toISOString().slice(0, 10);
};

const processSubscriptionStatuses = async (pool) => {
  try {
    // 1. Mark past expiries as 'Expired' (unless already Cancelled or Renewed)
    await pool.query(`
      UPDATE subscriptions
      SET status = 'Expired'
      WHERE expiry_date < CURDATE()
        AND status NOT IN ('Expired', 'Cancelled')
    `);

    // 2. Mark expiries within 3 days as 'Expiring Soon'
    await pool.query(`
      UPDATE subscriptions
      SET status = 'Expiring Soon'
      WHERE expiry_date >= CURDATE()
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        AND status NOT IN ('Expiring Soon', 'Cancelled')
    `);
  } catch (err) {
    console.error('[SubscriptionCronService] Error updating statuses:', err.message);
  }
};

const processSubscriptionReminders = async () => {
  try {
    const pool = db.getPool();
    if (!pool) return;

    await processSubscriptionStatuses(pool);
    const settings = await getSettingsMap(pool);

    const reminder3Days = settings.reminder_3_days_before === 'true';
    const reminder1Day = settings.reminder_1_day_before === 'true';
    const reminderExpiryDay = settings.reminder_expiry_day === 'true';

    const whatsappEnabled = settings.channel_whatsapp_enabled === 'true';
    const emailEnabled = settings.channel_email_enabled === 'true';

    const waToken = settings.whatsapp_cloud_api_token || '';
    const waPhoneId = settings.whatsapp_phone_number_id || '';
    const waTemplate = settings.whatsapp_template || `Hello {customer_name}, your {product_name} subscription expires on {expiry_date}. Please complete renewal payment to continue. Thank you, ElitePassBD.`;
    const emailSubjectTpl = settings.email_subject_template || `Your {product_name} Subscription is Expiring`;
    const emailBodyTpl = settings.email_body_template || `Hello {customer_name},\n\nYour {product_name} subscription ({package_plan}) is set to expire on {expiry_date}.\n\nTo keep your access uninterrupted, please complete your renewal payment.\n\nThank you,\nElitePassBD`;

    // Define active reminder triggers to evaluate
    const rulesToEvaluate = [];
    if (reminder3Days) rulesToEvaluate.push({ type: '3_DAYS_BEFORE', days: 3 });
    if (reminder1Day) rulesToEvaluate.push({ type: '1_DAY_BEFORE', days: 1 });
    if (reminderExpiryDay) rulesToEvaluate.push({ type: 'EXPIRY_DAY', days: 0 });

    for (const rule of rulesToEvaluate) {
      // Find target subscriptions whose expiry_date matches (CURDATE() + rule.days)
      const [subscriptions] = await pool.query(`
        SELECT * FROM subscriptions
        WHERE expiry_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND status IN ('Active', 'Expiring Soon')
      `, [rule.days]);

      for (const sub of subscriptions) {
        const formattedExpiry = formatDateStr(sub.expiry_date);
        const templateData = {
          customer_name: sub.customer_name,
          product_name: sub.product_name,
          package_plan: sub.package_plan,
          expiry_date: formattedExpiry
        };

        // 1. Customer WhatsApp Reminder
        if (whatsappEnabled && sub.whatsapp_number) {
          // Check duplicate
          const [dupCheck] = await pool.query(`
            SELECT id FROM subscription_reminders
            WHERE subscription_id = ? AND reminder_type = ? AND channel = 'WhatsApp' AND DATE(scheduled_at) = CURDATE()
          `, [sub.id, rule.type]);

          if (dupCheck.length === 0) {
            const messageText = replaceTemplateTags(waTemplate, templateData);
            let dispatchStatus = 'Sent';
            let failReason = null;

            if (waToken && waPhoneId) {
              const res = await sendWhatsAppCloudApi({
                token: waToken,
                phoneNumberId: waPhoneId,
                to: sub.whatsapp_number,
                text: messageText
              });
              if (!res.success) {
                dispatchStatus = 'Failed';
                failReason = res.reason;
              }
            } else {
              // Direct wa.me link ready for admin, marked as ready/scheduled
              dispatchStatus = 'Sent';
              failReason = 'Direct WhatsApp Link Generated (API Not Configured)';
            }

            await pool.query(`
              INSERT INTO subscription_reminders (subscription_id, reminder_type, channel, recipient, status, failure_reason, sent_at)
              VALUES (?, ?, 'WhatsApp', ?, ?, ?, NOW())
            `, [sub.id, rule.type, sub.whatsapp_number, dispatchStatus, failReason]);
          }
        }

        // 2. Customer Email Reminder
        if (emailEnabled && sub.email) {
          const [dupCheck] = await pool.query(`
            SELECT id FROM subscription_reminders
            WHERE subscription_id = ? AND reminder_type = ? AND channel = 'Email' AND DATE(scheduled_at) = CURDATE()
          `, [sub.id, rule.type]);

          if (dupCheck.length === 0) {
            const subject = replaceTemplateTags(emailSubjectTpl, templateData);
            const textBody = replaceTemplateTags(emailBodyTpl, templateData);
            const htmlBody = `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #121212; color: #ffffff; border-radius: 8px;">
                <h2 style="color: #10b981;">${subject}</h2>
                <p>Hello <strong>${sub.customer_name}</strong>,</p>
                <p>Your subscription for <strong>${sub.product_name}</strong> (${sub.package_plan}) expires on <strong style="color: #f59e0b;">${formattedExpiry}</strong>.</p>
                <p>To ensure continuous service, please complete your renewal payment.</p>
                <br/>
                <p>Thank you,<br/><strong>ElitePassBD</strong></p>
              </div>
            `;

            const sent = await sendEmail({
              to: sub.email,
              subject,
              text: textBody,
              html: htmlBody
            });

            await pool.query(`
              INSERT INTO subscription_reminders (subscription_id, reminder_type, channel, recipient, status, failure_reason, sent_at)
              VALUES (?, ?, 'Email', ?, ?, ?, NOW())
            `, [sub.id, rule.type, sub.email, sent ? 'Sent' : 'Failed', sent ? null : 'SMTP dispatch error']);
          }
        }
      }
    }

    // 3. Admin Expiry Alerts
    if (settings.admin_alert_email === 'true' && settings.admin_email) {
      const [expiringToday] = await pool.query(`
        SELECT customer_name, product_name, whatsapp_number, email FROM subscriptions
        WHERE expiry_date = CURDATE() AND status IN ('Active', 'Expiring Soon', 'Expired')
      `);

      if (expiringToday.length > 0) {
        const adminSubj = `[Admin Alert] ${expiringToday.length} Subscriptions Expiring Today (${formatDateStr(new Date())})`;
        const itemsList = expiringToday.map(i => `• ${i.customer_name} (${i.whatsapp_number}) - ${i.product_name}`).join('\n');
        const adminBody = `Hello Admin,\n\nThe following ${expiringToday.length} subscriptions expire today:\n\n${itemsList}\n\nPlease check your admin dashboard for details.`;

        await sendEmail({
          to: settings.admin_email,
          subject: adminSubj,
          text: adminBody
        });
      }
    }

    console.log('[SubscriptionCronService] Subscription status and reminder cron completed.');
  } catch (err) {
    console.error('[SubscriptionCronService] Cron processing error:', err.message);
  }
};

const initSubscriptionCron = () => {
  console.log('[SubscriptionCronService] Initializing subscription reminder cron scheduler (runs daily at 09:00 AM & on startup)...');

  // Run daily at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    await processSubscriptionReminders();
  });

  // Run once after 20 seconds of server startup
  setTimeout(() => {
    processSubscriptionReminders();
  }, 20000);
};

module.exports = {
  initSubscriptionCron,
  processSubscriptionReminders,
  processSubscriptionStatuses
};
