let cron;
try {
  cron = require('node-cron');
} catch (err) {
  console.warn('[SubscriptionCronService] node-cron module is not installed. Background subscription cron will be disabled until installed.');
}
const db = require('../config/db');
const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText } = require('../utils/mailer');
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
    // 0. Auto-repair any website subscriptions saved with 1-month fallback
    try {
      const { repairAllWebsiteSubscriptions } = require('./orderSubscriptionSyncService');
      await repairAllWebsiteSubscriptions(pool);
    } catch (repairErr) {
      console.warn('[SubscriptionCronService] Repair warning:', repairErr.message);
    }

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
            const textBody = replaceTemplateTags(emailBodyTpl, templateData) + getWhatsAppContactText();
            const appName = process.env.APP_NAME || 'ElitePassBD';
            const frontendUrl = process.env.FRONTEND_URL || 'https://elitepassbd.com';
            const renewUrl = `${frontendUrl}/dashboard`;

            const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0b1120; }
    .body-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    .body-td { padding: 0 !important; margin: 0 !important; }
    * {
      word-break: normal !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      hyphens: none !important;
      -webkit-hyphens: none !important;
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .banner-header { padding: 18px 12px !important; }
      .banner-header h1 { font-size: 17px !important; }
      .main-content { padding: 14px 10px !important; }
      .renew-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 12px 14px !important; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
  <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0b1120; margin: 0; padding: 0; border-collapse: collapse;">
    <tr>
      <td align="center" class="body-td" style="padding: 0; margin: 0;">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 0; overflow: hidden; border: 1px solid #334155;">
          
          <!-- Banner Header -->
          <tr>
            <td class="banner-header" style="background-color: #d97706; color: #ffffff; padding: 20px 14px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px;">
                Renewal Reminder ⏳
              </div>
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                Subscription Expiring Soon
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #fef3c7; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                ${sub.product_name} • ${sub.package_plan}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
              <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-weight: 600;">
                Hello ${sub.customer_name || 'Valued Customer'},
              </p>
              <p style="font-size: 12px; line-height: 1.55; color: #cbd5e1; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                This is a friendly reminder that your subscription with <strong style="color: #ffffff;">${appName}</strong> is expiring soon. To avoid any disruption to your service, please renew on time.
              </p>

              <!-- Subscription Info Box -->
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; width: 38%; font-size: 11.5px;">Product:</td>
                    <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${sub.product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Package:</td>
                    <td style="padding: 5px 0; font-weight: 600; color: #ffffff; font-size: 12px; word-break: normal; overflow-wrap: break-word;">${sub.package_plan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #94a3b8; font-size: 11.5px;">Expiry Date:</td>
                    <td style="padding: 5px 0; font-weight: 700; color: #f59e0b; font-size: 12px;">${formattedExpiry}</td>
                  </tr>
                </table>
              </div>

              <!-- Renewal CTA Button -->
              <div style="text-align: center; margin: 18px 0 10px 0;">
                <a href="${renewUrl}" target="_blank" class="renew-btn" style="background-color: #059669; color: #ffffff; padding: 11px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); max-width: 100%;">
                  Renew Subscription Now
                </a>
              </div>

              <p style="font-size: 11.5px; color: #64748b; text-align: center; margin-top: 14px; line-height: 1.5; word-break: normal; overflow-wrap: break-word;">
                Thank you for being with <strong style="color: #cbd5e1;">${appName}</strong>. If you have already renewed, please disregard this notice.
              </p>

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
  if (!cron) {
    console.warn('[SubscriptionCronService] Skipping cron initialization: node-cron is not installed.');
    return;
  }
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
