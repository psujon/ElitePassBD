const db = require('../config/db');
const { sendEmail } = require('../utils/mailer');

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL;
  if (url && !url.includes('localhost')) {
    return url;
  }
  return 'https://elitepassbd.com';
};

/**
 * Generate high quality, responsive HTML for Purchase Confirmation Email
 */
const generatePurchaseEmailHtml = (order, items) => {
  const frontendUrl = getFrontendUrl();
  const appName = process.env.APP_NAME || 'ElitePassBD';
  const trackUrl = `${frontendUrl}/dashboard`;

  const orderDateFormatted = order.created_at
    ? new Date(order.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleDateString();

  let itemsTableRows = items.map(item => {
    const imageSrc = item.image_url ? item.image_url : `${frontendUrl}/placeholder.png`;
    const itemTotal = (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2);

    const variantParts = [];
    if (item.package_name) variantParts.push(`Package: ${item.package_name}`);
    if (item.selected_device) variantParts.push(`Device: ${item.selected_device}`);
    if (item.selected_activation) variantParts.push(`Activation: ${item.selected_activation}`);
    const variantText = variantParts.join(' | ');

    return `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #2d2d2d; vertical-align: top;">
          <div style="display: flex; items-center; gap: 12px;">
            <img src="${imageSrc}" alt="${item.product_name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #444;" />
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 3px;">${item.product_name}</div>
              ${variantText ? `<div style="font-size: 12px; color: #a0a0a0;">${variantText}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #2d2d2d; text-align: center; color: #e0e0e0; font-size: 14px; font-weight: 600; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #2d2d2d; text-align: right; color: #e0e0e0; font-size: 14px; font-weight: 600; vertical-align: top;">
          ৳${parseFloat(item.price).toFixed(2)}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #2d2d2d; text-align: right; color: #10b981; font-size: 14px; font-weight: 700; vertical-align: top;">
          ৳${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Confirmation - Order #${order.id}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #e2e8f0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
        
        <!-- Top Green Banner Header -->
        <div style="background-color: #059669; color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">
            Thank You For Your Purchase!
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #d1fae5; font-weight: 500;">
            Order Confirmation #${order.id}
          </p>
        </div>

        <!-- Body Container -->
        <div style="padding: 28px 24px;">
          
          <p style="font-size: 16px; color: #ffffff; margin-top: 0; font-weight: 600;">
            Hello ${order.user_name || 'Valued Customer'},
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
            We have received your purchase at <strong style="color: #ffffff;">${appName}</strong>! Below are your order summary and item details:
          </p>

          <!-- Order Summary Meta Box -->
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="margin-bottom: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Order Number</span>
              <span style="font-size: 15px; font-weight: 700; color: #ffffff;">#${order.id}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Date & Time</span>
              <span style="font-size: 13px; font-weight: 600; color: #e2e8f0;">${orderDateFormatted}</span>
            </div>
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Payment Method</span>
              <span style="font-size: 13px; font-weight: 600; color: #e2e8f0;">${order.payment_method || 'Cash on Delivery'}</span>
            </div>
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">Payment Status</span>
              <span style="font-size: 13px; font-weight: 700; color: ${order.payment_status === 'Paid' ? '#34d399' : '#f59e0b'};">
                ${order.payment_status || 'Pending'}
              </span>
            </div>
          </div>

          <!-- Items Purchased Table -->
          <h3 style="font-size: 15px; color: #ffffff; margin-bottom: 12px; font-weight: 700; border-bottom: 1px solid #334155; padding-bottom: 8px;">
            Purchased Products
          </h3>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #334155; text-align: left;">
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Item</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; text-align: center;">Qty</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; text-align: right;">Price</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #94a3b8; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableRows}
            </tbody>
          </table>

          <!-- Total Calculation Card -->
          <div style="background-color: #0f172a; border-radius: 12px; padding: 18px; border: 1px solid #334155; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #cbd5e1;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #ffffff;">৳${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
            ${order.discount_amount && parseFloat(order.discount_amount) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #34d399;">
                <span>Discount (${order.coupon_code || 'Promo'}):</span>
                <span style="font-weight: 600;">-৳${parseFloat(order.discount_amount).toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="border-top: 1px solid #334155; pt: 10px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #10b981;">
              <span>Total Paid / Payable:</span>
              <span>৳${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <!-- Customer Info Box -->
          <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #334155; margin-bottom: 28px; font-size: 13px; line-height: 1.6; color: #94a3b8;">
            <div style="color: #ffffff; font-weight: 700; margin-bottom: 6px; font-size: 14px;">Contact & Delivery Info</div>
            <div><strong>Email:</strong> ${order.recipient_email}</div>
            <div><strong>Phone / WhatsApp:</strong> ${order.phone || 'N/A'}</div>
            ${order.shipping_address ? `<div><strong>Address:</strong> ${order.shipping_address}</div>` : ''}
          </div>

          <!-- Account Dashboard Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${trackUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
              View My Account & Orders
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #0f172a; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;">
          This email confirms your product purchase on ${appName}. If you have any questions, contact support via our website.
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Send purchase confirmation email for an order (Separate from license key delivery)
 */
const sendPurchaseConfirmationEmail = async (orderId) => {
  try {
    const pool = db.getPool();
    if (!pool) return false;

    // Fetch order details
    const [orders] = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      console.warn(`[PurchaseEmailService] Order #${orderId} not found.`);
      return false;
    }

    const order = orders[0];
    const recipientEmail = order.delivery_email || order.user_email;

    if (!recipientEmail) {
      console.warn(`[PurchaseEmailService] Order #${orderId} has no email address.`);
      return false;
    }

    // Check duplicate send
    if (order.purchase_email_sent === 1) {
      console.log(`[PurchaseEmailService] Purchase email already sent for Order #${orderId}. Skipping.`);
      return true;
    }

    // Fetch order items
    const [items] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    if (items.length === 0) {
      console.warn(`[PurchaseEmailService] Order #${orderId} has no items.`);
      return false;
    }

    const orderData = {
      ...order,
      recipient_email: recipientEmail,
      user_name: order.user_name || 'Customer'
    };

    const html = generatePurchaseEmailHtml(orderData, items);
    const subject = `Purchase Confirmation - Order #${orderId} - ${process.env.APP_NAME || 'ElitePassBD'}`;

    const textItems = items.map(i => `• ${i.product_name} (Qty: ${i.quantity}) - ৳${(parseFloat(i.price) * parseInt(i.quantity)).toFixed(2)}`).join('\n');
    const textBody = `Hello ${orderData.user_name},\n\nThank you for your purchase!\nOrder Number: #${orderId}\nTotal Amount: ৳${order.total_amount}\nPayment Status: ${order.payment_status}\n\nPurchased Items:\n${textItems}\n\nYou can track your order status in your customer dashboard.\n\nThank you,\nElitePassBD`;

    const sent = await sendEmail({
      to: recipientEmail,
      subject,
      text: textBody,
      html
    });

    if (sent) {
      await pool.query('UPDATE orders SET purchase_email_sent = 1 WHERE id = ?', [orderId]);
      console.log(`[PurchaseEmailService] Purchase confirmation email successfully sent for Order #${orderId} to ${recipientEmail}`);
      return true;
    } else {
      console.error(`[PurchaseEmailService] Failed to send purchase confirmation email for Order #${orderId}`);
      return false;
    }
  } catch (err) {
    console.error('[PurchaseEmailService] Error dispatching purchase email:', err.message);
    return false;
  }
};

module.exports = {
  sendPurchaseConfirmationEmail,
  generatePurchaseEmailHtml
};
