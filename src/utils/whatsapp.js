/**
 * WhatsApp Helper Utilities
 * Formats WhatsApp links supporting:
 * - Username handles: "@dollar_abir", "dollar_abir" -> https://wa.me/dollar_abir
 * - Links: "https://wa.me/dollar_abir", "wa.me/@dollar_abir" -> https://wa.me/dollar_abir
 * - BD local phone numbers: "017XXXXXXXX" -> https://wa.me/88017XXXXXXXX
 * - International numbers: "+88017XXXXXXXX", "15551234567" -> https://wa.me/...
 */

export const getWhatsAppLink = (input) => {
  if (!input) return null;
  let clean = String(input).trim();
  if (!clean) return null;

  // Direct wa.me or whatsapp link
  if (/^(https?:\/\/)?(www\.)?wa\.me\//i.test(clean)) {
    clean = clean.replace(/^(https?:\/\/)?(www\.)?wa\.me\//i, '').replace(/\/.*$/, '').trim();
  }

  // If username handle (starts with @ or contains letters/underscores/dots)
  if (clean.startsWith('@') || /[a-zA-Z]/.test(clean)) {
    const handle = clean.replace(/^@+/, '').trim();
    return handle ? `https://wa.me/${handle}` : null;
  }

  // Otherwise clean non-numeric characters for phone numbers
  let digits = clean.replace(/[^0-9]/g, '');
  if (!digits) return null;

  // Prepend Bangladesh country code '88' if starts with '01'
  if (digits.startsWith('01')) {
    digits = '88' + digits;
  }

  return `https://wa.me/${digits}`;
};

export const formatWhatsAppDisplay = (input) => {
  if (!input) return '';
  return String(input).trim();
};

