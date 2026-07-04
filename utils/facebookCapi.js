const crypto = require('crypto');

// Helper to hash user data as required by Meta (SHA256)
function hashData(value) {
  if (!value) return null;
  const cleanVal = String(value).trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanVal).digest('hex');
}

// Helper to hash phone data specifically (removes symbols, keeps digits)
function hashPhone(value) {
  if (!value) return null;
  const cleanVal = String(value).replace(/\D/g, ''); // keep only digits
  return crypto.createHash('sha256').update(cleanVal).digest('hex');
}

/**
 * Send event payload to Facebook Conversions API (CAPI)
 */
async function sendFbEvent({
  eventName,
  eventTime = Math.floor(Date.now() / 1000),
  eventId,
  userData = {},
  customData = {},
  req = null // express req object to extract client IP and user agent
}) {
  const pixelId = process.env.FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn(`[FB CAPI] Missing FB_PIXEL_ID or FB_ACCESS_TOKEN in env. Skipping event: "${eventName}"`);
    return;
  }

  // Build client user data
  const payloadUserData = {};

  // Extract client IP and user agent if req is provided
  if (req) {
    // Extract IP (handling potential proxy headers)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const firstIp = ip.split(',')[0].trim();
    const cleanIp = firstIp.startsWith('::ffff:') ? firstIp.substring(7) : firstIp;
    payloadUserData.client_ip_address = cleanIp;

    // Extract User Agent
    payloadUserData.client_user_agent = req.headers['user-agent'] || '';
  }

  // Load client IP and user agent from direct userData parameters if provided
  if (userData.client_ip_address) payloadUserData.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) payloadUserData.client_user_agent = userData.client_user_agent;

  // Hashing user identifiers to match Meta requirements
  if (userData.email) payloadUserData.em = [hashData(userData.email)];
  if (userData.phone) payloadUserData.ph = [hashPhone(userData.phone)];
  if (userData.name) {
    const nameParts = userData.name.trim().split(/\s+/);
    if (nameParts.length > 0) payloadUserData.fn = [hashData(nameParts[0])];
    if (nameParts.length > 1) payloadUserData.ln = [hashData(nameParts[nameParts.length - 1])];
  }

  const eventData = {
    event_name: eventName,
    event_time: eventTime,
    event_source_url: userData.event_source_url || (req ? `${req.protocol}://${req.get('host')}${req.originalUrl}` : ''),
    action_source: 'website',
    user_data: payloadUserData,
    custom_data: {
      currency: customData.currency || 'BDT',
      value: customData.value !== undefined ? parseFloat(customData.value) : undefined,
      content_type: customData.content_type || 'product',
      contents: customData.contents || undefined, // Array of { id, quantity, item_price }
      content_name: customData.content_name || undefined,
      content_category: customData.content_category || undefined
    }
  };

  if (eventId) {
    eventData.event_id = eventId;
  }

  const payload = {
    data: [eventData]
  };

  // Add Meta test event code if provided in environment (e.g. TEST12345)
  const testEventCode = process.env.FB_TEST_EVENT_CODE;
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resJson = await response.json();

    if (response.ok) {
      console.log(`[FB CAPI] Event "${eventName}" tracked successfully. Event ID: ${eventId || 'N/A'}. Response:`, resJson);
    } else {
      console.error(`[FB CAPI] Event "${eventName}" failed to send. Status: ${response.status}. Response:`, resJson);
    }
  } catch (err) {
    console.error(`[FB CAPI] Exception during event tracking for "${eventName}":`, err.message);
  }
}

module.exports = {
  sendFbEvent,
  hashData,
  hashPhone
};
