let cron;
try {
  cron = require('node-cron');
} catch (err) {
  console.warn('[ReviewEmailService] node-cron module is not installed. Review email cron will be disabled until installed.');
}
const db = require('../config/db');
const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText } = require('../utils/mailer');

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL;
  if (url && !url.includes('localhost')) {
    return url;
  }
  return 'https://elitepassbd.com';
};

const generateReviewEmailHtml = (userName, items, orderId) => {
  const frontendUrl = getFrontendUrl();
  const appName = process.env.APP_NAME || 'ElitePassBD';
  const firstProductUrl = `${frontendUrl}/product/${items[0].product_id}#reviews`;

  let itemsHtml = items.map(item => {
    const productUrl = `${frontendUrl}/product/${item.product_id}#reviews`;
    const imageSrc = item.image_url ? item.image_url : `${frontendUrl}/placeholder.png`;

    const variantParts = [];
    if (item.package_name) variantParts.push(item.package_name);
    if (item.selected_device) variantParts.push(item.selected_device);
    if (item.selected_activation) variantParts.push(item.selected_activation);
    const variantText = variantParts.length > 0 ? variantParts.join(' | ') : '';
    const priceText = item.price ? `${item.price}৳` : '';
    const detailsLine = [variantText, priceText].filter(Boolean).join(' / ');

    return `
      <div style="background-color: #2e2e2e; border: 1px solid #3d3d3d; border-radius: 10px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
          <img src="${imageSrc}" alt="${item.product_name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #444;" />
          <div>
            <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #ffffff; font-weight: 600; line-height: 1.3;">${item.product_name}</h4>
            ${detailsLine ? `<p style="margin: 0; font-size: 13px; color: #b0b0b0;">${detailsLine}</p>` : ''}
          </div>
        </div>
        <div>
          <a href="${productUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block; white-space: nowrap;">
            Review
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${userName}, আপনার কেনা পণ্যটি কেমন লেগেছে?</title>
      <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #121212; }
        .body-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        .body-td { padding: 0 !important; margin: 0 !important; }
        * {
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        img { max-width: 100%; height: auto; }
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .banner-header { padding: 18px 12px !important; }
          .banner-header h2 { font-size: 17px !important; }
          .main-content { padding: 14px 10px !important; }
          .item-card { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .item-btn-wrap { width: 100% !important; text-align: right !important; }
          .review-btn-main { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 12px 14px !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121212; margin: 0; padding: 0; color: #e0e0e0; width: 100%;">
      <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #121212; margin: 0; padding: 0; border-collapse: collapse;">
        <tr>
          <td align="center" class="body-td" style="padding: 0; margin: 0;">
            <div class="email-container" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e1e1e; border-radius: 0; overflow: hidden; border: 1px solid #2d2d2d;">
              
              <!-- Top Green Banner Image/Header -->
              <div class="banner-header" style="background-color: #059669; color: #ffffff; padding: 20px 14px; text-align: center; border-bottom: 2px solid #047857;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; line-height: 1.35; letter-spacing: -0.2px; word-break: normal; overflow-wrap: break-word;">
                  আমাদের সেবা সম্পর্কে আপনার মতামত জানান
                </h2>
              </div>

              <!-- Body Container -->
              <div class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
                
                <p style="font-size: 16px; color: #ffffff; margin-top: 0; font-weight: 600;">
                  হাই ${userName},
                </p>

                <p style="font-size: 14px; line-height: 1.6; color: #cccccc; margin-bottom: 20px;">
                  আপনি সম্প্রতি <strong style="color: #ffffff;">${appName}</strong> থেকে নিচের পণ্যগুলো কিনেছেন:
                </p>

                <!-- Product Items List -->
                <div style="margin-bottom: 24px;">
                  ${itemsHtml}
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #cccccc; margin-bottom: 16px;">
                  পণ্যগুলো ব্যবহার করে থাকলে আপনার অভিজ্ঞতা সম্পর্কে একটি ছোট্ট রিভিউ দিলে আমরা খুবই খুশি হব। 😊
                </p>

                <p style="font-size: 14px; line-height: 1.6; color: #cccccc; margin-bottom: 22px;">
                  আপনার মতামত ভবিষ্যতের ক্রেতাদের সঠিক সিদ্ধান্ত নিতে সাহায্য করবে এবং আমাদের সেবা আরও উন্নত করতে উৎসাহ দেবে।
                </p>

                <p style="font-size: 14px; line-height: 1.6; color: #ffffff; font-weight: 500; margin-bottom: 18px;">
                  ধন্যবাদ আমাদের উপর আস্থা রাখার জন্য। ❤️
                </p>

                <p style="font-size: 14px; line-height: 1.5; color: #cccccc; margin-bottom: 24px;">
                  শুভেচ্ছান্তে,<br />
                  <strong style="color: #ffffff; font-size: 15px;">${appName}</strong>
                </p>

                <!-- Main Review Button -->
                <div style="text-align: center; margin: 26px 0 12px 0;">
                  <a href="${firstProductUrl}" target="_blank" class="review-btn-main" style="background-color: #059669; color: #ffffff; padding: 13px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); max-width: 100%;">
                    Review
                  </a>
                </div>

                <!-- WhatsApp Support Contact Box -->
                ${getWhatsAppContactBlock(true)}

              </div>

              <!-- Footer -->
              <div style="background-color: #0f172a; padding: 22px 20px 20px 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; line-height: 1.6;">
                <div style="margin-bottom: 6px; text-align: center;">
                  <img src="${process.env.EMAIL_LOGO_URL || 'cid:brand_logo'}" alt="${appName}" width="165" style="width: 165px; max-width: 100%; height: auto; display: inline-block; vertical-align: middle; border: 0; outline: none; text-decoration: none;" />
                </div>
                <div style="color: #64748b; font-size: 12px; font-weight: 500; letter-spacing: 0.2px;">Dhaka, Bangladesh</div>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const processPendingReviewEmails = async () => {
  try {
    const pool = db.getPool();
    if (!pool) return;

    // Fetch orders delivered over 24 hours ago that haven't received review emails
    const [orders] = await pool.query(`
      SELECT o.id as order_id, o.user_id, o.delivery_email, u.email as user_email, COALESCE(u.name, 'Customer') as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'Delivered'
        AND o.review_email_sent = 0
        AND o.completed_at IS NOT NULL
        AND o.completed_at <= NOW() - INTERVAL 24 HOUR
      LIMIT 20
    `);

    if (orders.length === 0) return;

    console.log(`[ReviewEmailService] Found ${orders.length} orders pending review email dispatch.`);

    for (const order of orders) {
      const recipientEmail = order.delivery_email || order.user_email;

      if (!recipientEmail) {
        console.warn(`[ReviewEmailService] Order #${order.order_id} has no recipient email. Marking as skipped.`);
        await pool.query('UPDATE orders SET review_email_sent = 1 WHERE id = ?', [order.order_id]);
        continue;
      }

      // Fetch items for this order with price, package, activation details
      const [items] = await pool.query(`
        SELECT oi.product_id, oi.quantity, oi.price, oi.package_name, oi.selected_device, oi.selected_activation, p.name as product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.order_id]);

      if (items.length === 0) {
        await pool.query('UPDATE orders SET review_email_sent = 1 WHERE id = ?', [order.order_id]);
        continue;
      }

      const html = generateReviewEmailHtml(order.user_name, items, order.order_id);
      const subject = `${order.user_name}, আপনার কেনা পণ্যটি কেমন লেগেছে?`;

      const text = `Hello ${order.user_name},\n\nThank you for shopping at ${process.env.APP_NAME || 'ElitePassBD'}!\nPlease share your review for your purchase.${getWhatsAppContactText()}`;

      const sent = await sendEmail({
        to: recipientEmail,
        subject,
        text,
        html
      });

      if (sent) {
        await pool.query('UPDATE orders SET review_email_sent = 1 WHERE id = ?', [order.order_id]);
        console.log(`[ReviewEmailService] Successfully sent review email for Order #${order.order_id} to ${recipientEmail}`);
      } else {
        await pool.query('UPDATE orders SET review_email_sent = 2 WHERE id = ?', [order.order_id]);
        console.warn(`[ReviewEmailService] Delivery failed for Order #${order.order_id}. Marked as attempted/skipped to prevent continuous retry.`);
      }
    }
  } catch (err) {
    console.error('[ReviewEmailService] Error processing review emails:', err.message);
  }
};

const initReviewEmailCron = () => {
  if (!cron) {
    console.warn('[ReviewEmailService] Skipping cron initialization: node-cron is not installed.');
    return;
  }
  console.log('[ReviewEmailService] Initializing 24-hour delayed review email cron scheduler (runs every 10 minutes)...');

  // Check every 10 minutes for orders delivered 24+ hours ago
  cron.schedule('*/10 * * * *', async () => {
    await processPendingReviewEmails();
  });

  // Also run once 15 seconds after server startup
  setTimeout(() => {
    processPendingReviewEmails();
  }, 15000);
};

module.exports = {
  initReviewEmailCron,
  processPendingReviewEmails
};
