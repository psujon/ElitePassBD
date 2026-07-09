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
  req = null
}) {
  // Facebook Conversions API tracking disabled
}

module.exports = {
  sendFbEvent,
  hashData,
  hashPhone
};
