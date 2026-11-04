/**
 * WhatsApp & Social Helper Utilities
 * Formats WhatsApp & Telegram links supporting:
 * - Username handles: "@dollar_abir", "dollar_abir" -> https://wa.me/dollar_abir
 * - Links: "https://wa.me/dollar_abir", "wa.me/@dollar_abir" -> https://wa.me/dollar_abir
 * - BD local phone numbers: "017XXXXXXXX" -> https://wa.me/88017XXXXXXXX
 * - International numbers: "+88017XXXXXXXX", "15551234567" -> https://wa.me/...
 * - Fallback phone support: If input is a username, prefers vendor's valid phone number for the redirect link
 *   since WhatsApp's Click-to-Chat API requires international phone digits to successfully redirect to chat.
 */

export const getWhatsAppLink = (input, phoneFallback = null) => {
  if (!input && !phoneFallback) return null;
  let clean = String(input || '').trim();

  // If input is empty or invalid, try fallback
  if (!clean && phoneFallback) {
    clean = String(phoneFallback).trim();
  }

  // Direct wa.me or whatsapp link
  if (/^(https?:\/\/)?(www\.)?wa\.me\//i.test(clean)) {
    clean = clean.replace(/^(https?:\/\/)?(www\.)?wa\.me\//i, '').replace(/\/.*$/, '').trim();
  }

  // If input is a username handle (starts with @ or contains letters)
  const isUsername = clean.startsWith('@') || /[a-zA-Z]/.test(clean);

  // If it's a username handle, BUT we have a valid phone number (in phoneFallback),
  // PREFER the phone number for the wa.me redirect URL because WhatsApp Click-to-Chat
  // API requires international phone digits to successfully redirect to WhatsApp Web / App chat!
  if (isUsername && phoneFallback) {
    let fallbackDigits = String(phoneFallback).replace(/[^0-9]/g, '');
    if (fallbackDigits.length >= 7) {
      if (fallbackDigits.startsWith('01')) fallbackDigits = '88' + fallbackDigits;
      return `https://wa.me/${fallbackDigits}`;
    }
  }

  // If it's pure username handle without phone fallback:
  if (isUsername) {
    const handle = clean.replace(/^@+/, '').trim();
    return handle ? `https://wa.me/${handle}` : null;
  }

  // Otherwise clean non-numeric characters for phone numbers
  let digits = clean.replace(/[^0-9]/g, '');
  if (!digits) {
    if (phoneFallback) {
      let fallbackDigits = String(phoneFallback).replace(/[^0-9]/g, '');
      if (fallbackDigits.startsWith('01')) fallbackDigits = '88' + fallbackDigits;
      return fallbackDigits ? `https://wa.me/${fallbackDigits}` : null;
    }
    return null;
  }

  // Prepend Bangladesh country code '88' if starts with '01'
  if (digits.startsWith('01')) {
    digits = '88' + digits;
  }

  return `https://wa.me/${digits}`;
};

export const getTelegramLink = (handle) => {
  if (!handle) return null;
  let clean = String(handle).trim();
  if (!clean) return null;
  if (/^(https?:\/\/)?(www\.)?t\.me\//i.test(clean)) {
    return clean.startsWith('http') ? clean : `https://${clean}`;
  }
  const cleanHandle = clean.replace(/^@+/, '').trim();
  return cleanHandle ? `https://t.me/${cleanHandle}` : null;
};

export const handleWhatsAppClick = (e, input, phoneFallback = null, toastInstance = null) => {
  if (e && e.stopPropagation) e.stopPropagation();

  const clean = String(input || '').trim();
  const digits = String(phoneFallback || input || '').replace(/[^0-9]/g, '');
  const isUsername = clean.startsWith('@') || /[a-zA-Z]/.test(clean);

  // If this contact is a username and has no valid phone fallback
  if (isUsername && digits.length < 7) {
    const handle = clean.startsWith('@') ? clean : `@${clean}`;
    const rawName = clean.replace(/^@+/, '');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(rawName);
        if (toastInstance && typeof toastInstance.success === 'function') {
          toastInstance.success(`Copied username "${handle}"! In WhatsApp, search to chat.`, {
            duration: 4000
          });
        }
      }
    } catch (err) {
      console.warn('Failed to copy WhatsApp username:', err);
    }
  }
};

export const formatWhatsAppDisplay = (input) => {
  if (!input) return '';
  return String(input).trim();
};
