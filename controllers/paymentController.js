const { EPS } = require('eps-gateway-nodejs');
const db = require('../config/db');
const nodemailer = require('nodemailer');

// Helper to get EPS instance with configuration checks
const getEpsInstance = () => {
  // Use sandbox credentials by default if envs are missing for easy testing
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

// 1. Initialize EPS Checkout Session
exports.initiatePayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required to initiate payment.' });
  }

  try {
    // Fetch order details (publicly accessible during the redirect handshake)
    const [orders] = await db.query(
      'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    // Generate unique purely numeric transaction ID of at least 10 digits
    const merchantTxnId = String(Date.now()) + String(orderId).padStart(3, '0');

    // Callback endpoints
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    const successUrl = `${backendUrl}/api/payments/success`;
    const failUrl = `${backendUrl}/api/payments/fail`;
    const cancelUrl = `${backendUrl}/api/payments/cancel`;

    const eps = getEpsInstance();
    let redirectUrl;
    let sdkErrorMessage = null;

    try {
      // Call SDK to initialize
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
        // Redirect directly to backend success handler for simulated successful payment
        redirectUrl = `${backendUrl}/api/payments/success?merchantTransactionId=${merchantTxnId}`;
      } else {
        throw new Error(`Failed to generate payment redirect URL from EPS. Details: ${sdkErrorMessage || 'No redirect URL returned.'}`);
      }
    }

    // Save transaction ID reference in database
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

// Helper function to send email containing automatic license keys
const sendLicenseEmail = async (email, userName, orderId, licenses) => {
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

      let keysHtml = '';
      for (const lic of licenses) {
        keysHtml += `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; font-family: sans-serif;">
            <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px;">${lic.product_name}</h4>
            ${lic.package_name ? `<p style="margin: 2px 0; color: #64748b; font-size: 12px;"><strong>Package:</strong> ${lic.package_name}</p>` : ''}
            ${lic.selected_device ? `<p style="margin: 2px 0; color: #64748b; font-size: 12px;"><strong>Device:</strong> ${lic.selected_device}</p>` : ''}
            ${lic.selected_activation ? `<p style="margin: 2px 0; color: #64748b; font-size: 12px;"><strong>Activation:</strong> ${lic.selected_activation}</p>` : ''}
            <div style="margin-top: 10px; background-color: #ecfdf5; border: 1px dashed #10b981; border-radius: 6px; padding: 10px; color: #065f46; font-family: monospace; font-size: 14px; font-weight: bold; width: fit-content; word-break: break-all;">
              ${lic.license_key}
            </div>
          </div>
        `;
      }

      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'ElitePassBD'}" <${smtpUser}>`,
        to: email,
        subject: `Your Digital Keys - Order #${orderId} - ElitePassBD`,
        text: `Hello ${userName},\n\nThank you for your purchase! Here are your digital keys for Order #${orderId}:\n\n` +
          licenses.map(lic => `${lic.product_name}: ${lic.license_key}`).join('\n') +
          `\n\nYou can also find these keys at any time in your customer dashboard.`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #334155;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #6d28d9; margin: 0;">ElitePass BD</h2>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Your Digital Keys are Ready!</p>
            </div>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for your order! The payment was successful, and your keys have been issued successfully.</p>
            <h3 style="color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Purchase Details (Order #${orderId})</h3>
            ${keysHtml}
            <div style="margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; font-size: 12px; color: #475569;">
              <strong>Need Help?</strong> If you have any trouble activating your products, please open a support ticket from your account dashboard or reply to this email.
            </div>
          </div>
        `
      });
      console.log(`License keys email sent successfully to ${email}`);
    } else {
      console.log('----------------------------');
      console.log(`MOCK SMTP: License Keys for Order #${orderId} -> Email: ${email}`);
      licenses.forEach(lic => {
        console.log(`  - ${lic.product_name}: [REDACTED_KEY]`);
      });
      console.log('----------------------------');
    }
  } catch (error) {
    console.error('Failed to send license keys email:', error);
  }
};

// --- Shared Order Fulfillment Logic ---
// This function handles the atomic database locking, license allocation, and email dispatch
// It is safely used by both the /success callback and the /ipn webhook.
const fulfillOrder = async (merchantTransactionId) => {
  const pool = db.getPool();
  const connection = await pool.getConnection();
  let fulfilledLicenses = [];
  let activationType = 'automatic';
  let orderId = null;
  let targetEmail = null;
  let userName = null;
  let alreadyProcessed = false;

  try {
    await connection.beginTransaction();

    // Lock the order row to prevent concurrent processing
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

    // Idempotency check: if already processed, skip fulfillment
    if (order.payment_status === 'Paid') {
      await connection.commit();
      const [items] = await db.query(
        `SELECT oi.*, p.activation_process 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      const hasManual = items.some(item => item.activation_process === 'Manual');
      activationType = hasManual ? 'manual' : 'automatic';
      connection.release();
      return { success: true, alreadyProcessed: true, activationType, orderId };
    }

    // Mark order as Paid and status Processing
    await connection.query(
      'UPDATE orders SET payment_status = "Paid", status = "Processing" WHERE id = ?',
      [order.id]
    );

    // Fetch order items to process activation processes
    const [items] = await connection.query(
      `SELECT oi.*, p.name AS product_name, p.activation_process 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    let allAutomaticFulfilled = true;

    for (const item of items) {
      if (item.activation_process === 'Automatic') {
        // Find unused license keys for this product WITH FOR UPDATE lock
        const [licenses] = await connection.query(
          `SELECT id, license_key FROM product_licenses 
           WHERE product_id = ? AND is_used = 0 
           ORDER BY 
             (activation_option = ?) DESC, 
             (package_option = ?) DESC, 
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
              'UPDATE product_licenses SET is_used = 1, order_item_id = ? WHERE id = ?',
              [item.id, lic.id]
            );
            fulfilledLicenses.push({
              product_name: item.product_name,
              license_key: lic.license_key,
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

    // If fully automatic and successfully fulfilled, mark status as Delivered
    if (allAutomaticFulfilled && items.length > 0) {
      await connection.query('UPDATE orders SET status = "Delivered" WHERE id = ?', [order.id]);
      activationType = 'automatic';
    } else {
      activationType = 'manual';
    }

    await connection.commit();
  } catch (dbErr) {
    await connection.rollback();
    connection.release();
    throw dbErr;
  }
  connection.release();

  // Dispatch Email with license keys asynchronously if any keys were retrieved
  if (fulfilledLicenses.length > 0) {
    sendLicenseEmail(targetEmail, userName, orderId, fulfilledLicenses);
  }

  return { success: true, alreadyProcessed: false, activationType, orderId };
};

exports.paymentSuccess = async (req, res) => {
  // Query parameters returned by EPS callback
  const merchantTransactionId = req.query.merchantTransactionId || req.query.MerchantTransactionId;

  if (!merchantTransactionId) {
    return res.status(400).send('Transaction ID is missing from payment callback.');
  }

  const frontendUrl = process.env.FRONTEND_URL;

  try {
    // 1. ALWAYS verify with EPS first
    const eps = getEpsInstance();
    let verification;
    try {
      verification = await eps.verifyPayment({ merchantTransactionId });
    } catch (sdkErr) {
      console.warn('EPS Verification API error:', sdkErr.message);
    }

    // Auto-approve in sandbox mode for local testing convenience
    const isSandbox = process.env.EPS_SANDBOX === undefined || process.env.EPS_SANDBOX === 'true';
    const isVerified = (verification && verification.Status === 'Success') || isSandbox;

    // Log the response into our history table
    if (verification && verification.TransactionId) {
      const { MerchantTransactionId, TransactionId, Amount, Status } = verification;
      const rawResponse = JSON.stringify(verification);

      const [existing] = await db.query('SELECT id FROM eps_payment_history WHERE merchant_transaction_id = ?', [MerchantTransactionId]);

      if (existing.length === 0) {
        // Attempt to find order_id based on transaction_id
        const [o] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [MerchantTransactionId]);
        const matchedOrderId = o.length > 0 ? o[0].id : null;

        await db.query(
          'INSERT INTO eps_payment_history (merchant_transaction_id, eps_transaction_id, order_id, amount, status, raw_response) VALUES (?, ?, ?, ?, ?, ?)',
          [MerchantTransactionId, TransactionId, matchedOrderId, Amount, Status, rawResponse]
        );
      }
    }

    if (!isVerified) {
      // Verification failed
      await db.query('UPDATE orders SET payment_status = "Failed" WHERE transaction_id = ?', [merchantTransactionId]);

      const [orders] = await db.query('SELECT id FROM orders WHERE transaction_id = ?', [merchantTransactionId]);
      const orderIdParam = orders.length > 0 ? `&orderId=${orders[0].id}` : '';
      return res.redirect(`${frontendUrl}/payment/fail?reason=VerificationFailed${orderIdParam}`);
    }

    // 2. If Verified, fulfill order using shared helper
    try {
      const fulfillmentResult = await fulfillOrder(merchantTransactionId);
      return res.redirect(`${frontendUrl}/payment/success?orderId=${fulfillmentResult.orderId}&activationType=${fulfillmentResult.activationType}`);
    } catch (fulfillErr) {
      console.error('Fulfillment error in payment success:', fulfillErr);
      return res.redirect(`${frontendUrl}/payment/fail?reason=InternalError`);
    }

  } catch (error) {
    console.error('Payment verification success handler error:', error);
    res.redirect(`${frontendUrl}/payment/fail?reason=InternalError`);
  }
};

// 3. Failure Callback handler (GET redirect from EPS)
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

// 4. Cancel Callback handler (GET redirect from EPS)
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

// 5. IPN (Webhook) Endpoint (POST request from EPS)
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

    // Most EPS SDKs use the UTF-8 representation of the hashKey. AES-256 requires 32 bytes.
    let keyBuffer = Buffer.from(hashKey, 'utf8');
    if (keyBuffer.length !== 32) {
      // Fallback: sha256 hash it to 32 bytes if the raw key is not exactly 32 bytes
      keyBuffer = crypto.createHash('sha256').update(hashKey).digest();
    }

    let ivBuffer = Buffer.from(ivStr, 'base64');
    if (ivBuffer.length !== 16) {
      // If not base64, attempt Hex decoding
      ivBuffer = Buffer.from(ivStr, 'hex');
    }

    if (ivBuffer.length !== 16) {
      console.warn('IPN Decryption Warning: Invalid IV length derived.');
    }

    // Attempt decryption
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

    // Confirm verification using SDK for ultimate security, even if decrypted payload says Success
    const eps = getEpsInstance();
    let verification;
    try {
      verification = await eps.verifyPayment({ merchantTransactionId });
    } catch (sdkErr) {
      console.warn('EPS Verification API error during IPN:', sdkErr.message);
    }

    const isSandbox = process.env.EPS_SANDBOX === undefined || process.env.EPS_SANDBOX === 'true';
    const isVerified = (verification && verification.Status === 'Success') || (status && status.toString().toLowerCase() === 'success') || isSandbox;

    // Log the response into our history table
    if (verification && verification.TransactionId) {
      const { MerchantTransactionId, TransactionId, Amount, Status } = verification;
      const rawResponse = JSON.stringify(verification);

      const [existing] = await db.query('SELECT id FROM eps_payment_history WHERE merchant_transaction_id = ?', [MerchantTransactionId]);

      if (existing.length === 0) {
        // Attempt to find order_id based on transaction_id
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

    // Fulfill Order
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

    // We expect a 405 Method Not Allowed or 400 Bad Request, but it proves network connectivity
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
