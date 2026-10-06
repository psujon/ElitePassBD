const db = require('../config/db');
const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText } = require('../utils/mailer');

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
    const unitPrice = parseFloat(item.price).toFixed(2);

    const variantParts = [];
    if (item.package_name) variantParts.push(`Package: ${item.package_name}`);
    if (item.selected_device) variantParts.push(`Device: ${item.selected_device}`);
    if (item.selected_activation) variantParts.push(`Activation: ${item.selected_activation}`);
    const variantText = variantParts.join(' | ');

    return `
      <!-- Desktop & Mobile Item Row -->
      <tr class="product-row" style="border-bottom: 1px solid #334155;">
        <!-- Product Details Column -->
        <td class="product-info-cell" style="padding: 12px 6px; vertical-align: top;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 44px; vertical-align: top; padding-right: 10px;">
                <img src="${imageSrc}" alt="${item.product_name}" width="42" height="42" style="width: 42px; height: 42px; object-fit: cover; border-radius: 8px; border: 1px solid #334155; display: block; max-width: 100%;" />
              </td>
              <td style="vertical-align: top;">
                <div class="product-name" style="font-size: 13px; font-weight: 600; color: #ffffff; line-height: 1.35; margin-bottom: 3px; word-break: normal; overflow-wrap: break-word; word-wrap: break-word; hyphens: none; -webkit-hyphens: none;">
                  ${item.product_name}
                </div>
                ${variantText ? `<div class="product-meta" style="font-size: 11px; color: #94a3b8; line-height: 1.35; word-break: normal; overflow-wrap: break-word; word-wrap: break-word; hyphens: none; -webkit-hyphens: none;">${variantText}</div>` : ''}

                <!-- Mobile Only Price & Qty Row (shown on narrow screens via media queries) -->
                <table class="mobile-price-bar" role="presentation" cellpadding="0" cellspacing="0" border="0" style="display: none; width: 100%; border-collapse: collapse; margin-top: 8px; padding-top: 6px; border-top: 1px solid #1e293b;">
                  <tr>
                    <td style="font-size: 12px; color: #94a3b8; text-align: left; vertical-align: middle;">
                      Qty: <strong style="color: #f1f5f9;">${item.quantity}</strong> × ৳${unitPrice}
                    </td>
                    <td style="font-size: 14px; font-weight: 700; color: #10b981; text-align: right; vertical-align: middle; white-space: nowrap;">
                      ৳${itemTotal}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>

        <!-- Desktop Qty Column (hidden on mobile) -->
        <td class="desktop-col desktop-qty" style="padding: 12px 6px; text-align: center; color: #e2e8f0; font-size: 13.5px; font-weight: 600; vertical-align: top; width: 12%;">
          ${item.quantity}
        </td>

        <!-- Desktop Unit Price Column (hidden on mobile) -->
        <td class="desktop-col desktop-price" style="padding: 12px 6px; text-align: right; color: #e2e8f0; font-size: 13.5px; font-weight: 600; vertical-align: top; width: 20%; white-space: nowrap;">
          ৳${unitPrice}
        </td>

        <!-- Desktop Total Column (hidden on mobile) -->
        <td class="desktop-col desktop-total" style="padding: 12px 6px; text-align: right; color: #10b981; font-size: 14px; font-weight: 700; vertical-align: top; width: 22%; white-space: nowrap;">
          ৳${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Purchase Confirmation - Order #${order.id}</title>
      <style type="text/css">
        /* Client-specific Resets */
        body, table, td, a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
          max-width: 100%;
        }
        table {
          border-collapse: collapse !important;
        }
        body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          background-color: #0b1120;
        }
        .body-wrapper {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        .body-td {
          padding: 0 !important;
          margin: 0 !important;
        }
        * {
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }

        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
          .body-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .body-td {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .email-container {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .banner-header {
            padding: 14px 6px !important;
          }
          .banner-title {
            font-size: 16px !important;
          }
          .main-content {
            padding: 8px 2px !important;
            width: 100% !important;
          }
          .meta-box {
            padding: 8px 4px !important;
            margin-bottom: 10px !important;
            border-radius: 4px !important;
          }
          .meta-col {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 4px 2px !important;
            border-bottom: 1px solid #1e293b !important;
          }
          .meta-col:last-child {
            border-bottom: none !important;
          }

          /* Product Table Responsiveness: Stacks on mobile */
          .product-table {
            width: 100% !important;
            max-width: 100% !important;
          }
          .product-table thead {
            display: none !important;
          }
          .product-row {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            background-color: #0f172a !important;
            border: 1px solid #334155 !important;
            border-radius: 8px !important;
            padding: 10px 8px !important;
            margin-bottom: 10px !important;
          }
          .product-info-cell {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            border: none !important;
          }
          .desktop-col {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            padding: 0 !important;
          }
          .mobile-price-bar {
            display: table !important;
            width: 100% !important;
          }
          .cta-btn {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: center !important;
            padding: 12px 14px !important;
          }
          .total-card-inner {
            padding: 12px 10px !important;
          }
          .footer-cell {
            padding: 16px 12px !important;
          }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 0; color: #e2e8f0; width: 100%;">
      <!-- Outer centering table -->
      <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; background-color: #0b1120; margin: 0; padding: 0;">
        <tr>
          <td align="center" class="body-td" style="padding: 0; margin: 0;">
            
            <!-- Main Email Container (Fluid on mobile, max 600px on desktop) -->
            <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 0; overflow: hidden; border: 1px solid #334155;">
              
              <!-- Top Emerald Header Banner -->
              <tr>
                <td class="banner-header" style="background-color: #059669; color: #ffffff; padding: 20px 14px; text-align: center;">
                  <h1 class="banner-title" style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px; line-height: 1.3;">
                    Thank You For Your Purchase!
                  </h1>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                    Order Confirmation #${order.id}
                  </p>
                </td>
              </tr>

              <!-- Body Container -->
              <tr>
                <td class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
                  
                  <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; font-weight: 600; margin-bottom: 8px;">
                    Hello ${order.user_name || 'Valued Customer'},
                  </p>

                  <p style="font-size: 12px; line-height: 1.55; color: #cbd5e1; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                    We have received your purchase at <strong style="color: #ffffff;">${appName}</strong>! Below are your order summary and item details:
                  </p>

                  <!-- Order Summary Meta Box (Bulletproof Table) -->
                  <table class="meta-box" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 16px; border-collapse: collapse;">
                    <tr>
                      <td class="meta-col" style="padding: 10px 12px; width: 50%; vertical-align: top; border-bottom: 1px solid #1e293b;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Order Number</span>
                        <span style="font-size: 13px; font-weight: 700; color: #ffffff;">#${order.id}</span>
                      </td>
                      <td class="meta-col" style="padding: 10px 12px; width: 50%; vertical-align: top; border-bottom: 1px solid #1e293b;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Date & Time</span>
                        <span style="font-size: 11.5px; font-weight: 600; color: #e2e8f0;">${orderDateFormatted}</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="meta-col" style="padding: 10px 12px; width: 50%; vertical-align: top;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Payment Method</span>
                        <span style="font-size: 11.5px; font-weight: 600; color: #e2e8f0;">${order.payment_method || 'Cash on Delivery'}</span>
                      </td>
                      <td class="meta-col" style="padding: 10px 12px; width: 50%; vertical-align: top;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Payment Status</span>
                        <span style="font-size: 11.5px; font-weight: 700; color: ${order.payment_status === 'Paid' ? '#34d399' : '#f59e0b'};">
                          ${order.payment_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Items Purchased Header -->
                  <div style="font-size: 13px; color: #ffffff; margin-bottom: 8px; font-weight: 700; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                    Purchased Products
                  </div>

                  <!-- Responsive Purchased Products Table -->
                  <table class="product-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #334155; text-align: left;">
                        <th style="padding: 6px 4px; font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Item</th>
                        <th class="desktop-col" style="padding: 6px 4px; font-size: 10px; text-transform: uppercase; color: #94a3b8; text-align: center; width: 12%; letter-spacing: 0.5px;">Qty</th>
                        <th class="desktop-col" style="padding: 6px 4px; font-size: 10px; text-transform: uppercase; color: #94a3b8; text-align: right; width: 20%; letter-spacing: 0.5px;">Price</th>
                        <th class="desktop-col" style="padding: 6px 4px; font-size: 10px; text-transform: uppercase; color: #94a3b8; text-align: right; width: 22%; letter-spacing: 0.5px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsTableRows}
                    </tbody>
                  </table>

                  <!-- Total Calculation Card (Bulletproof Table) -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; margin-bottom: 16px; border-collapse: collapse;">
                    <tr>
                      <td class="total-card-inner" style="padding: 12px 14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="font-size: 12px; color: #cbd5e1; padding-bottom: 6px; text-align: left;">Subtotal:</td>
                            <td style="font-size: 12.5px; font-weight: 600; color: #ffffff; padding-bottom: 6px; text-align: right; white-space: nowrap;">৳${parseFloat(order.total_amount).toFixed(2)}</td>
                          </tr>
                          ${order.discount_amount && parseFloat(order.discount_amount) > 0 ? `
                          <tr>
                            <td style="font-size: 12px; color: #34d399; padding-bottom: 6px; text-align: left;">Discount (${order.coupon_code || 'Promo'}):</td>
                            <td style="font-size: 12.5px; font-weight: 600; color: #34d399; padding-bottom: 6px; text-align: right; white-space: nowrap;">-৳${parseFloat(order.discount_amount).toFixed(2)}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #334155; padding-top: 8px; font-size: 13px; font-weight: 800; color: #10b981; text-align: left;">Total Paid / Payable:</td>
                            <td style="border-top: 1px solid #334155; padding-top: 8px; font-size: 14.5px; font-weight: 800; color: #10b981; text-align: right; white-space: nowrap;">৳${parseFloat(order.total_amount).toFixed(2)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Billing Address / Customer Info Box -->
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 12px 14px; border: 1px solid #334155; margin-bottom: 16px; font-size: 12px; line-height: 1.55; color: #cbd5e1; word-break: normal; overflow-wrap: break-word;">
                    <div style="color: #ffffff; font-weight: 700; margin-bottom: 4px; font-size: 12.5px;">Billing address</div>
                    <div style="font-weight: 600; color: #ffffff; margin-bottom: 2px;">${order.user_name || 'Customer'}</div>
                    ${order.phone ? `<div><a href="tel:${order.phone}" style="color: #a78bfa; text-decoration: none;">${order.phone}</a></div>` : ''}
                    <div><a href="mailto:${order.recipient_email}" style="color: #a78bfa; text-decoration: none;">${order.recipient_email}</a></div>
                    ${order.shipping_address ? `<div style="margin-top: 4px; color: #94a3b8; font-size: 11.5px;">${order.shipping_address}</div>` : ''}
                  </div>

                  ${(order.additional_notes || order.notes) ? `
                  <!-- Order & Subscription Notes Box -->
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 10px 12px; border: 1px solid #334155; border-left: 3px solid #10b981; margin-bottom: 16px; font-size: 11.5px; line-height: 1.5; color: #cbd5e1; word-break: normal; overflow-wrap: break-word;">
                    <div style="color: #34d399; font-weight: 700; margin-bottom: 4px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">Order & Subscription Notes:</div>
                    <div style="color: #ffffff; font-size: 12px; line-height: 1.5;">${order.additional_notes || order.notes}</div>
                  </div>
                  ` : ''}

                  <!-- Account Dashboard Button -->
                  <div style="text-align: center; margin: 18px 0 10px 0;">
                    <a href="${trackUrl}" target="_blank" class="cta-btn" style="background-color: #059669; color: #ffffff; padding: 11px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); max-width: 100%;">
                      View My Account & Orders
                    </a>
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

    // Do not send invoice email if payment is still pending
    if (order.payment_status === 'Pending') {
      console.log(`[PurchaseEmailService] Order #${orderId} payment is Pending. Skipping purchase email.`);
      return false;
    }

    // Fetch order items
    const [items] = await pool.query(`
      SELECT oi.*, COALESCE(p.name, 'Archived Product') as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
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
    const notesText = (orderData.additional_notes || orderData.notes) ? `\n\nNotes:\n${orderData.additional_notes || orderData.notes}` : '';
    const textBody = `Hello ${orderData.user_name},\n\nThank you for your purchase!\nOrder Number: #${orderId}\nTotal Amount: ৳${order.total_amount}\nPayment Status: ${order.payment_status}\n\nPurchased Items:\n${textItems}${notesText}\n\nYou can track your order status in your customer dashboard.${getWhatsAppContactText()}`;

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
