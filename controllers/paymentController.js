const { EPS } = require('eps-gateway-nodejs');
const db = require('../config/db');
const { sendEmail, getWhatsAppContactBlock, getEmailFooter, getWhatsAppContactText, formatRulesHtml, formatLicenseKeyHtml } = require('../utils/mailer');
const { sendPurchaseConfirmationEmail } = require('../services/purchaseEmailService');
const { syncWebsiteOrderToSubscriptions } = require('../services/orderSubscriptionSyncService');

const getEpsInstance = () => {
  const config = {
    username: process.env.EPS_USERNAME,
    password: process.env.EPS_PASSWORD,
    hashKey: process.env.EPS_HASH_KEY,
    merchantId: process.env.EPS_MERCHANT_ID,
    storeId: process.env.EPS_STORE_ID,
    sandbox: process.env.EPS_SANDBOX === 'true',
  };

  return new EPS(config);
};

exports.initiatePayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required to initiate payment.' });
  }

  try {
    const [orders] = await db.query(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    const merchantTxnId = String(Date.now()) + String(orderId).padStart(3, '0');

    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    const successUrl = `${backendUrl}/api/payments/success`;
    const failUrl = `${backendUrl}/api/payments/fail`;
    const cancelUrl = `${backendUrl}/api/payments/cancel`;

    const eps = getEpsInstance();
    let redirectUrl;
    let sdkErrorMessage = null;

    try {
      const paymentResult = await eps.initializePayment({
        customerOrderId: String(orderId),
        merchantTransactionId: merchantTxnId,
        totalAmount: parseFloat(order.total_amount),

        successUrl,
        failUrl,
        cancelUrl,

        customerName: order.user_name,
        customerEmail: order.user_email,
        customerPhone: order.phone,
        customerAddress: 'Gazipur, Dhaka, Bangladesh', // order.shipping_address || 'Gazipur, Dhaka, Bangladesh',
        customerCity: 'Dhaka',
        customerState: 'Dhaka',
        customerPostcode: '1200',

        productName: 'ElitePass BD Digital Purchase'
      });

      if (paymentResult && paymentResult.RedirectURL) {
        redirectUrl = paymentResult.RedirectURL;
      }
    } catch (sdkErr) {
      sdkErrorMessage = sdkErr.message;
      toast.error('EPS SDK initializePayment failed:', sdkErr.message);
    }

    if (!redirectUrl) {
      const isSandbox = process.env.EPS_SANDBOX === undefined || process.env.EPS_SANDBOX === 'true';
      if (isSandbox) {
        console.info('Using mock redirect URL in sandbox mode.');
        redirectUrl = `${backendUrl}/api/payments/success?merchantTransactionId=${merchantTxnId}`;
      } else {
        throw new Error(`Failed to generate payment redirect URL from EPS. Details: ${sdkErrorMessage || 'No redirect URL returned.'}`);
      }
    }

    await db.query(
      'UPDATE orders SET transaction_id = ?, payment_status = "Pending" WHERE id = ?',
      [merchantTxnId, orderId]
    );

    res.json({ redirectUrl });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ message: error.message || 'Failed to initialize payment gateway.' });
  }
};

const sendLicenseEmail = async (email, userName, orderId, licenses) => {
  try {
    const appName = process.env.APP_NAME || 'ElitePassBD';
    const frontendUrl = process.env.FRONTEND_URL || 'https://elitepassbd.com';
    const dashboardUrl = `${frontendUrl}/dashboard`;

    let keysHtml = '';
    for (const lic of licenses) {
      keysHtml += `
        <div class="key-card" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; box-sizing: border-box; width: 100%;">
          <div style="font-size: 13.5px; font-weight: 700; color: #ffffff; margin-bottom: 4px; line-height: 1.35; word-break: normal; overflow-wrap: break-word;">${lic.product_name}</div>
          ${lic.package_name ? `<div style="margin: 2px 0; color: #94a3b8; font-size: 11px; word-break: normal; overflow-wrap: break-word;"><strong>Package:</strong> ${lic.package_name}</div>` : ''}
          ${lic.selected_device ? `<div style="margin: 2px 0; color: #94a3b8; font-size: 11px; word-break: normal; overflow-wrap: break-word;"><strong>Device:</strong> ${lic.selected_device}</div>` : ''}
          ${lic.selected_activation ? `<div style="margin: 2px 0; color: #94a3b8; font-size: 11px; word-break: normal; overflow-wrap: break-word;"><strong>Activation:</strong> ${lic.selected_activation}</div>` : ''}
          ${lic.rules ? formatRulesHtml(lic.rules, true) : ''}
          
          <div class="key-box" style="margin-top: 8px; background-color: #1e293b; border: 1.5px dashed #10b981; border-radius: 6px; padding: 8px 10px; color: #ffffff; display: block; width: 100%; box-sizing: border-box; word-break: normal; overflow-wrap: break-word; text-align: left;">
            ${formatLicenseKeyHtml(lic.license_key, true)}
          </div>
        </div>
      `;
    }

    const emailSent = await sendEmail({
      to: email,
      subject: `Your Digital Keys - Order #${orderId} - ${appName}`,
      text: `Hello ${userName},\n\nThank you for your purchase! Here are your digital keys for Order #${orderId}:\n\n` +
        licenses.map(lic => `${lic.product_name}: ${lic.license_key}${lic.rules ? `\nLicense Rules: ${lic.rules}` : ''}`).join('\n\n') +
        `\n\nYou can also find these keys at any time in your customer dashboard: ${dashboardUrl}${getWhatsAppContactText()}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Digital Keys - Order #${orderId}</title>
  <style type="text/css">
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
    img { max-width: 100%; height: auto; }
    @media only screen and (max-width: 600px) {
      .body-wrapper { width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .body-td { padding: 0 !important; margin: 0 !important; width: 100% !important; }
      .email-container { width: 100% !important; max-width: 100% !important; min-width: 100% !important; border-radius: 0 !important; border: none !important; margin: 0 !important; }
      .banner-header { padding: 14px 6px !important; }
      .banner-header h1 { font-size: 16px !important; }
      .main-content { padding: 8px 2px !important; width: 100% !important; }
      .key-card { padding: 8px 4px !important; margin-bottom: 8px !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; width: 100% !important; }
      .key-box { padding: 6px 4px !important; margin-top: 6px !important; border-radius: 4px !important; }
      .rules-box { padding: 6px 4px !important; margin: 6px 0 !important; border-radius: 4px !important; }
      .dash-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 10px 14px !important; }
      .footer-cell { padding: 12px 6px !important; }
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
            <td class="banner-header" style="background-color: #059669; color: #ffffff; padding: 20px 14px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px;">
                Your Digital Keys are Ready!
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5; font-weight: 500; word-break: normal; overflow-wrap: break-word;">
                Order Confirmation #${orderId} • ${appName}
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td class="main-content" style="padding: 16px 12px; box-sizing: border-box; width: 100%;">
              <p style="font-size: 13.5px; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-weight: 600;">
                Hello ${userName || 'Customer'},
              </p>
              <p style="font-size: 12px; line-height: 1.55; color: #cbd5e1; margin-bottom: 14px; word-break: normal; overflow-wrap: break-word;">
                Thank you for your purchase! Your payment was successful, and your official digital license keys / credentials have been generated below:
              </p>

              <!-- Digital Keys Section -->
              <div style="font-size: 13px; color: #ffffff; margin-bottom: 10px; font-weight: 700; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                🔑 Issued Digital Keys & Credentials
              </div>
              
              ${keysHtml}

              <!-- Help / Support Box -->
              <div style="background-color: #0f172a; border-radius: 8px; padding: 10px 12px; border: 1px solid #334155; margin-top: 14px; font-size: 11.5px; line-height: 1.5; color: #94a3b8; word-break: normal; overflow-wrap: break-word;">
                <strong style="color: #ffffff;">Need Help?</strong> If you have any questions or need help activating your subscription, you can access your keys anytime in your dashboard or contact our support team.
              </div>

              <!-- Dashboard CTA Button -->
              <div style="text-align: center; margin: 18px 0 10px 0;">
                <a href="${dashboardUrl}" target="_blank" class="dash-btn" style="background-color: #059669; color: #ffffff; padding: 11px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); max-width: 100%;">
                  View in My Account Dashboard
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
</html>`
    });

    if (emailSent) {
      console.log(`License keys email sent successfully to ${email}`);
      return true;
    } else {
      console.log(`Failed to send license keys email to ${email}`);
      return false;
    }
  } catch (error) {
    console.error('Failed to send license keys email:', error);
    return false;
  }
};

const fulfillOrder = async (merchantTransactionId) => {
  const pool = db.getPool();
  const connection = await pool.getConnection();
  let fulfilledLicenses = [];
  let activationType = 'automatic';
  let orderId = null;
  let targetEmail = null;
  let userName = null;
  let alreadyProcessed = false;
  let pixelData = null;

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.transaction_id = ? FOR UPDATE`,
      [merchantTransactionId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      throw new Error('Corresponding order not found for this transaction.');
    }

    const order = orders[0];
    orderId = order.id;
    targetEmail = order.delivery_email || order.user_email;
    userName = order.user_name;

    if (order.payment_status === 'Paid') {
      await connection.commit();
      const [items] = await db.query(
        `SELECT oi.*, COALESCE(p.name, 'Archived Product') AS product_name, p.activation_process, p.packages 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      const hasManual = items.some(item => {
        let actProcess = item.activation_process || 'Manual';
        if (item.packages) {
          try {
            const pkgs = typeof item.packages === 'string' ? JSON.parse(item.packages) : item.packages;
            const matchedPkg = pkgs.find(pkg => 
              pkg.duration === item.package_name && 
              (!pkg.activation || !item.selected_activation || pkg.activation.toLowerCase() === item.selected_activation.toLowerCase())
            );
            if (matchedPkg && matchedPkg.activation_process) {
              actProcess = matchedPkg.activation_process;
            }
          } catch (e) {}
        }
        return actProcess === 'Manual';
      });
      activationType = hasManual ? 'manual' : 'automatic';

      const fbContents = items.map(item => ({
        id: String(item.product_id),
        quantity: parseInt(item.quantity),
        item_price: parseFloat(item.price)
      }));

      pixelData = {
        value: parseFloat(order.total_amount),
        currency: 'BDT',
        content_ids: items.map(item => String(item.product_id)),
        contents: fbContents,
        items: items.map(item => ({
          item_id: String(item.product_id),
          item_name: item.product_name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        })),
        email: order.delivery_email || order.user_email,
        phone: order.phone,
        name: order.user_name
      };

      connection.release();
      return { success: true, alreadyProcessed: true, activationType, orderId, pixelData };
    }

    await connection.query(
      'UPDATE orders SET payment_status = "Paid", status = "Processing" WHERE id = ?',
      [order.id]
    );

    const [items] = await connection.query(
      `SELECT oi.*, COALESCE(p.name, 'Archived Product') AS product_name, p.activation_process, p.packages 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    let allAutomaticFulfilled = true;

    for (const item of items) {
      let actProcess = item.activation_process || 'Manual';
      if (item.packages) {
        try {
          const pkgs = typeof item.packages === 'string' ? JSON.parse(item.packages) : item.packages;
          const matchedPkg = pkgs.find(pkg => 
            pkg.duration === item.package_name && 
            (!pkg.activation || !item.selected_activation || pkg.activation.toLowerCase() === item.selected_activation.toLowerCase())
          );
          if (matchedPkg && matchedPkg.activation_process) {
            actProcess = matchedPkg.activation_process;
          }
        } catch (e) {}
      }

      if (actProcess === 'Automatic') {
        const [licenses] = await connection.query(
          `SELECT id, license_key, rules FROM product_licenses 
           WHERE product_id = ? AND is_used = 0 
           ORDER BY 
             (activation_option <=> ?) DESC, 
             (package_option <=> ?) DESC, 
             id ASC 
           LIMIT ? FOR UPDATE`,
          [
            item.product_id,
            item.selected_activation || null,
            item.package_name || null,
            item.quantity
          ]
        );

        if (licenses.length >= item.quantity) {
          for (const lic of licenses) {
            await connection.query(
              'UPDATE product_licenses SET is_used = 1, order_item_id = ?, used_at = NOW() WHERE id = ?',
              [item.id, lic.id]
            );
            fulfilledLicenses.push({
              product_id: item.product_id,
              product_name: item.product_name,
              license_key: lic.license_key,
              rules: lic.rules,
              package_name: item.package_name,
              selected_device: item.selected_device,
              selected_activation: item.selected_activation
            });
          }
        } else {
          allAutomaticFulfilled = false;
          console.warn(`Stock shortage for automatic product: ${item.product_name}. Needed: ${item.quantity}, Found: ${licenses.length}`);
        }
      } else {
        allAutomaticFulfilled = false;
      }
    }

    if (allAutomaticFulfilled && items.length > 0) {
      await connection.query('UPDATE orders SET status = "Delivered", completed_at = IFNULL(completed_at, NOW()) WHERE id = ?', [order.id]);
      activationType = 'automatic';

      // Auto-create subscription entry with exact package duration for automatic delivered order
      try {
        await syncWebsiteOrderToSubscriptions(order.id, connection);
      } catch (syncErr) {
        console.error('[PaymentController] Subscription auto-sync error:', syncErr.message);
      }
    } else {
      activationType = 'manual';
    }

    await connection.commit();

    sendPurchaseConfirmationEmail(orderId).catch(err => {
      console.error('Failed to send purchase email in fulfillOrder:', err);
    });

    try {
      const { sendFbEvent } = require('../utils/facebookCapi');
      const fbContents = items.map(item => ({
        id: String(item.product_id),
        quantity: parseInt(item.quantity),
        item_price: parseFloat(item.price)
      }));

      pixelData = {
        value: parseFloat(order.total_amount),
        currency: 'BDT',
        content_ids: items.map(item => String(item.product_id)),
        contents: fbContents,
        items: items.map(item => ({
          item_id: String(item.product_id),
          item_name: item.product_name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        })),
        email: order.delivery_email || order.user_email,
        phone: order.phone,
        name: order.user_name
      };

      sendFbEvent({
        eventName: 'Purchase',
        eventId: `purchase_${order.id}`,
        userData: {
          email: order.delivery_email || order.user_email,
          phone: order.phone,
          name: order.user_name,
          client_ip_address: order.client_ip,
          client_user_agent: order.client_user_agent,
          event_source_url: `${process.env.FRONTEND_URL || 'https://elitepassbd.com'}/payment/success?orderId=${order.id}`
        },
        customData: {
          currency: 'BDT',
          value: parseFloat(order.total_amount),
          content_type: 'product',
          contents: fbContents
        }
      });

      let itemsHtml = `<div style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 16px 0 8px 0;">Ordered Items:</div>
      <table style="width: 100%; max-width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px;" border="1" cellpadding="6" cellspacing="0" bordercolor="#cbd5e1">
        <thead>
          <tr style="background-color: #f1f5f9; color: #334155; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 8px 6px; text-align: left;">Item</th>
            <th style="padding: 8px 6px; text-align: left; width: 28%;">Delivery</th>
            <th style="padding: 8px 6px; text-align: left; width: 34%;">License / Status</th>
          </tr>
        </thead>
        <tbody>`;

      items.forEach(item => {
        itemsHtml += `<tr><td style="padding: 8px 6px; vertical-align: top;"><strong style="color: #0f172a;">${item.product_name}</strong> (Qty: ${item.quantity})`;
        if (item.package_name) itemsHtml += `<br><small style="color: #64748b;">Package: ${item.package_name}</small>`;
        if (item.selected_device) itemsHtml += `<br><small style="color: #64748b;">Device: ${item.selected_device}</small>`;
        if (item.selected_activation) itemsHtml += `<br><small style="color: #64748b;">Activation: ${item.selected_activation}</small>`;
        itemsHtml += `</td>`;

        let actProcess = item.activation_process || 'Manual';
        if (item.packages) {
          try {
            const pkgs = typeof item.packages === 'string' ? JSON.parse(item.packages) : item.packages;
            const matchedPkg = pkgs.find(pkg => 
              pkg.duration === item.package_name && 
              (!pkg.activation || !item.selected_activation || pkg.activation.toLowerCase() === item.selected_activation.toLowerCase())
            );
            if (matchedPkg && matchedPkg.activation_process) {
              actProcess = matchedPkg.activation_process;
            }
          } catch (e) {}
        }

        itemsHtml += `<td style="padding: 8px 6px; vertical-align: top; color: #334155; font-size: 12px;">${actProcess}</td>`;

        let licenseContent = '-';
        if (actProcess === 'Automatic') {
          const itemLicenses = fulfilledLicenses.filter(lic => lic.product_id === item.product_id && lic.package_name === item.package_name);
          if (itemLicenses.length > 0) {
            licenseContent = itemLicenses.map(l => `<code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px; display: inline-block; margin: 2px 0; word-break: normal; overflow-wrap: break-word; font-size: 11px;">${l.license_key}</code>`).join('<br>');
          } else {
            licenseContent = '<span style="color: #dc2626; font-weight: 700; font-size: 11px;">Out of Stock</span>';
          }
        }
        itemsHtml += `<td style="padding: 8px 6px; vertical-align: top;">${licenseContent}</td></tr>`;
      });
      itemsHtml += `</tbody></table>`;

      sendEmail({
        to: 'johirul3218@gmail.com',
        subject: `Order Completed (Paid) - Order #${order.id}`,
        text: `Order #${order.id} has been paid successfully.\nAmount: ৳${order.total_amount}\nTransaction ID: ${merchantTransactionId}\nPhone: ${order.phone}\nDelivery Email: ${order.delivery_email || order.user_email}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order #${order.id} Paid</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .body-wrapper { padding: 0 !important; }
      .main-content { padding: 16px 12px !important; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #334155; width: 100%;">
  <table class="body-wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; background-color: #f1f5f9; padding: 16px 6px;">
    <tr>
      <td align="center" style="padding: 6px 2px;">
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #059669; color: #ffffff; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 700;">Order #${order.id} Paid & Fulfilled 🎉</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #d1fae5;">Total: ৳${order.total_amount} BDT</p>
            </td>
          </tr>
          <tr>
            <td class="main-content" style="padding: 22px 20px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 13px; line-height: 1.6;">
                <div><strong>Transaction ID:</strong> ${merchantTransactionId}</div>
                <div><strong>Customer:</strong> ${order.user_name}</div>
                <div><strong>Phone:</strong> ${order.phone}</div>
                <div><strong>Delivery Email:</strong> ${order.delivery_email || order.user_email}</div>
              </div>
              ${itemsHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }).catch(err => console.error('Failed to send admin order completion email:', err));
    } catch (fbTrackErr) {
      console.error('FB Purchase CAPI Trigger Error:', fbTrackErr);
    }
  } catch (dbErr) {
    await connection.rollback();
    connection.release();
    throw dbErr;
  }
  connection.release();

  if (fulfilledLicenses.length > 0) {
    sendLicenseEmail(targetEmail, userName, orderId, fulfilledLicenses).then(sent => {
      if (sent) {
        db.query('UPDATE orders SET license_email_sent = 1 WHERE id = ?', [orderId]).catch(e => console.error('Failed to update license_email_sent:', e.message));
      }
    });
  }

  return { success: true, alreadyProcessed: false, activationType, orderId, pixelData };
};

exports.paymentSuccess = async (req, res) => {
  const merchantTransactionId = req.query.merchantTransactionId || req.query.MerchantTransactionId;

  if (!merchantTransactionId) {
    return res.status(400).send('Transaction ID is missing from payment callback.');
  }

  const frontendUrl = process.env.FRONTEND_URL;

  try {
    const eps = getEpsInstance();
    let verification;
    try {
      verification = await eps.verifyPayment({ merchantTransactionId });
    } catch (sdkErr) {
      console.warn('EPS Verification API error:', sdkErr.message);
    }

    const isSandbox = process.env.EPS_SANDBOX === undefined || process.env.EPS_SANDBOX === 'true';
    const isVerified = (verification && verification.Status === 'Success') || isSandbox;

    if (verification && verification.TransactionId) {
      const { MerchantTransactionId, TransactionId, Amount, Status } = verification;
      const rawResponse = JSON.stringify(verification);

      const [existing] = await db.query('SELECT id FROM eps_payment_history WHERE merchant_transaction_id = ?', [MerchantTransactionId]);

      if (existing.length === 0) {
        const [o] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [MerchantTransactionId]);
        const matchedOrderId = o.length > 0 ? o[0].id : null;

        await db.query(
          'INSERT INTO eps_payment_history (merchant_transaction_id, eps_transaction_id, order_id, amount, status, raw_response) VALUES (?, ?, ?, ?, ?, ?)',
          [MerchantTransactionId, TransactionId, matchedOrderId, Amount, Status, rawResponse]
        );
      }
    }

    if (!isVerified) {
      await db.query('UPDATE orders SET payment_status = "Failed" WHERE transaction_id = ?', [merchantTransactionId]);

      const [orders] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [merchantTransactionId]);
      const orderIdParam = orders.length > 0 ? `&orderId=${orders[0].id}` : '';
      return res.redirect(`${frontendUrl}/payment/fail?reason=VerificationFailed${orderIdParam}`);
    }

    try {
      const fulfillmentResult = await fulfillOrder(merchantTransactionId);
      let redirectUrl = `${frontendUrl}/payment/success?orderId=${fulfillmentResult.orderId}&activationType=${fulfillmentResult.activationType}`;
      if (fulfillmentResult.pixelData) {
        const pixelDataStr = Buffer.from(JSON.stringify(fulfillmentResult.pixelData)).toString('base64');
        redirectUrl += `&pixel=${encodeURIComponent(pixelDataStr)}`;
      }
      return res.redirect(redirectUrl);
    } catch (fulfillErr) {
      console.error('Fulfillment error in payment success:', fulfillErr);
      return res.redirect(`${frontendUrl}/payment/fail?reason=InternalError`);
    }

  } catch (error) {
    console.error('Payment verification success handler error:', error);
    res.redirect(`${frontendUrl}/payment/fail?reason=InternalError`);
  }
};

exports.paymentFail = async (req, res) => {
  const merchantTransactionId = req.query.merchantTransactionId || req.query.MerchantTransactionId;
  const frontendUrl = process.env.FRONTEND_URL;

  try {
    if (merchantTransactionId) {
      const [orders] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [merchantTransactionId]);
      if (orders.length > 0) {
        const orderId = orders[0].id;
        await db.query('UPDATE orders SET payment_status = "Failed" WHERE id = ?', [orderId]);
        return res.redirect(`${frontendUrl}/payment/fail?orderId=${orderId}`);
      }
    }
    res.redirect(`${frontendUrl}/payment/fail`);
  } catch (error) {
    console.error('Payment failure callback error:', error);
    res.redirect(`${frontendUrl}/payment/fail`);
  }
};

exports.paymentCancel = async (req, res) => {
  const merchantTransactionId = req.query.merchantTransactionId || req.query.MerchantTransactionId;
  const frontendUrl = process.env.FRONTEND_URL;

  try {
    if (merchantTransactionId) {
      const [orders] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [merchantTransactionId]);
      if (orders.length > 0) {
        const orderId = orders[0].id;
        await db.query('UPDATE orders SET payment_status = "Cancelled", status = "Cancelled" WHERE id = ?', [orderId]);
        return res.redirect(`${frontendUrl}/payment/cancel?orderId=${orderId}`);
      }
    }
    res.redirect(`${frontendUrl}/payment/cancel`);
  } catch (error) {
    console.error('Payment cancel callback error:', error);
    res.redirect(`${frontendUrl}/payment/cancel`);
  }
};

const crypto = require('crypto');
const { default: toast } = require('react-hot-toast');

exports.paymentIpn = async (req, res) => {
  const { Data } = req.body;

  if (!Data) {
    return res.status(400).json({ status: "ERROR", message: "Invalid payload: Missing Data field" });
  }

  try {
    const parts = Data.split(':');
    if (parts.length !== 2) {
      return res.status(400).json({ status: "ERROR", message: "Invalid payload format" });
    }

    const ivStr = parts[0];
    const encryptedBase64 = parts[1];

    const hashKey = process.env.EPS_HASH_KEY || '';

    let keyBuffer = Buffer.from(hashKey, 'utf8');
    if (keyBuffer.length !== 32) {
      keyBuffer = crypto.createHash('sha256').update(hashKey).digest();
    }

    let ivBuffer = Buffer.from(ivStr, 'base64');
    if (ivBuffer.length !== 16) {
      ivBuffer = Buffer.from(ivStr, 'hex');
    }

    if (ivBuffer.length !== 16) {
      console.warn('IPN Decryption Warning: Invalid IV length derived.');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    let ipnData;
    try {
      ipnData = JSON.parse(decrypted);
    } catch (parseErr) {
      console.error('IPN JSON Parse error:', decrypted);
      return res.status(400).json({ status: "ERROR", message: "Decrypted payload is not JSON" });
    }

    console.log('Received EPS IPN:', ipnData);

    const merchantTransactionId = ipnData.MerchantTransactionId || ipnData.merchantTransactionId || ipnData.transactionId;
    const status = ipnData.Status || ipnData.status || ipnData.PaymentStatus;

    if (!merchantTransactionId) {
      return res.status(400).json({ status: "ERROR", message: "Transaction ID missing in decrypted payload" });
    }

    const eps = getEpsInstance();
    let verification;
    try {
      verification = await eps.verifyPayment({ merchantTransactionId });
    } catch (sdkErr) {
      console.warn('EPS Verification API error during IPN:', sdkErr.message);
    }

    const isSandbox = process.env.EPS_SANDBOX === undefined || process.env.EPS_SANDBOX === 'true';
    const isVerified = (verification && verification.Status === 'Success') || (status && status.toString().toLowerCase() === 'success') || isSandbox;

    if (verification && verification.TransactionId) {
      const { MerchantTransactionId, TransactionId, Amount, Status } = verification;
      const rawResponse = JSON.stringify(verification);

      const [existing] = await db.query('SELECT id FROM eps_payment_history WHERE merchant_transaction_id = ?', [MerchantTransactionId]);

      if (existing.length === 0) {
        const [o] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [MerchantTransactionId]);
        const matchedOrderId = o.length > 0 ? o[0].id : null;

        await db.query(
          'INSERT INTO eps_payment_history (merchant_transaction_id, eps_transaction_id, order_id, amount, status, raw_response) VALUES (?, ?, ?, ?, ?, ?)',
          [MerchantTransactionId, TransactionId, matchedOrderId, Amount, Status, rawResponse]
        );
      }
    }

    if (!isVerified) {
      await db.query('UPDATE orders SET payment_status = "Failed" WHERE transaction_id = ?', [merchantTransactionId]);
      return res.status(200).json({ status: "OK", message: "IPN received and processed (Failed)" });
    }

    await fulfillOrder(merchantTransactionId);

    return res.status(200).json({ status: "OK", message: "IPN received and saved successfully" });

  } catch (error) {
    console.error('IPN processing error:', error);
    return res.status(500).json({ status: "ERROR", message: "Decryption failed or internal error" });
  }
};

exports.testEpsConnection = async (req, res) => {
  try {
    const axios = require('axios');
    const isSandbox = process.env.EPS_SANDBOX === 'true';
    const url = isSandbox ? 'https://sandbox-pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS' : 'https://pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS';

    await axios.get(url);
    res.json({ success: true, message: "Connected to EPS server successfully", url });
  } catch (error) {
    res.json({
      success: false,
      message: "Network Error",
      url: error.config?.url,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      errorMessage: error.message
    });
  }
};

exports.getEpsHistory = async (req, res) => {
  try {
    const [history] = await db.query(`
      SELECT 
        e.id, 
        e.merchant_transaction_id, 
        e.eps_transaction_id, 
        e.amount, 
        e.status as payment_status, 
        e.created_at,
        o.id as order_id, 
        o.delivery_email,
        u.name as user_name, 
        u.email as user_email,
        GROUP_CONCAT(DISTINCT p.name SEPARATOR '||') as product_names,
        GROUP_CONCAT(DISTINCT pl.license_key SEPARATOR '||') as license_keys
      FROM eps_payment_history e
      LEFT JOIN orders o ON e.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_licenses pl ON oi.id = pl.order_item_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    res.json(history);
  } catch (error) {
    console.error('Failed to fetch EPS history:', error);
    res.status(500).json({ message: 'Error fetching EPS history' });
  }
};

exports.sendLicenseEmail = sendLicenseEmail;
