const https = require('https');

/**
 * Format phone number for WhatsApp wa.me link & API
 * e.g., "01912345678" => "8801912345678"
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  return cleaned;
};

/**
 * Parse dynamic template tags
 * e.g. {customer_name}, {product_name}, {expiry_date}, {package_plan}
 */
const replaceTemplateTags = (template, data = {}) => {
  if (!template) return '';
  let result = template;
  result = result.replace(/\{customer_name\}/gi, data.customer_name || 'Customer');
  result = result.replace(/\{product_name\}/gi, data.product_name || 'Subscription');
  result = result.replace(/\{expiry_date\}/gi, data.expiry_date || '');
  result = result.replace(/\{package_plan\}/gi, data.package_plan || '');
  return result;
};

/**
 * Build direct wa.me URL link for 1-click WhatsApp messaging in browser/app
 */
const getDirectWhatsAppUrl = (phone, text) => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) return '#';
  const encodedText = encodeURIComponent(text || '');
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
};

/**
 * Dispatch message via WhatsApp Cloud API (if credentials configured)
 */
const sendWhatsAppCloudApi = async ({ token, phoneNumberId, to, text }) => {
  if (!token || !phoneNumberId || !to || !text) {
    return { success: false, reason: 'Missing WhatsApp Cloud API credentials or parameters.' };
  }

  const recipient = formatPhoneNumber(to);
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: { preview_url: false, body: text }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ success: true, data: parsed });
          } catch (e) {
            resolve({ success: true, data: responseBody });
          }
        } else {
          resolve({ success: false, reason: `HTTP ${res.statusCode}: ${responseBody}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, reason: err.message });
    });

    req.write(payload);
    req.end();
  });
};

module.exports = {
  formatPhoneNumber,
  replaceTemplateTags,
  getDirectWhatsAppUrl,
  sendWhatsAppCloudApi
};
