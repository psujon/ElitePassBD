const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Cached support WhatsApp number loaded dynamically from site_settings table
let cachedSupportWhatsApp = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 10000; // 10 seconds

/**
 * Clean & Format WhatsApp number for wa.me URL and visible display
 */
const formatWhatsApp = (raw) => {
  if (!raw) return { clean: '8801925112444', display: '+8801925112444' };
  let digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '88' + digits;
  }
  const display = digits.startsWith('+') ? digits : `+${digits}`;
  return { clean: digits, display };
};

/**
 * Fetch support WhatsApp number directly from database site_settings table (with fallback to subscription_settings)
 */
const fetchSupportWhatsAppFromDB = async (forceFresh = false) => {
  try {
    const now = Date.now();
    if (!forceFresh && cachedSupportWhatsApp && (now - lastSettingsFetch < SETTINGS_CACHE_TTL)) {
      return cachedSupportWhatsApp;
    }
    const pool = db.getPool();
    if (!pool) return cachedSupportWhatsApp || process.env.SUPPORT_WHATSAPP || '8801925112444';

    // 1. Primary: check site_settings table for 'support_whatsapp'
    const [rows] = await pool.query("SELECT setting_value FROM site_settings WHERE setting_key = 'support_whatsapp' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].setting_value && rows[0].setting_value.trim()) {
      cachedSupportWhatsApp = rows[0].setting_value.trim();
      lastSettingsFetch = now;
      return cachedSupportWhatsApp;
    }

    // 2. Secondary fallback: check subscription_settings for 'admin_whatsapp'
    try {
      const [subRows] = await pool.query("SELECT setting_value FROM subscription_settings WHERE setting_key = 'admin_whatsapp' LIMIT 1");
      if (subRows && subRows.length > 0 && subRows[0].setting_value && subRows[0].setting_value.trim()) {
        cachedSupportWhatsApp = subRows[0].setting_value.trim();
        lastSettingsFetch = now;
        return cachedSupportWhatsApp;
      }
    } catch (_) {}

  } catch (err) {
    // If table or DB temporarily inaccessible, return cached or env
  }
  return cachedSupportWhatsApp || process.env.SUPPORT_WHATSAPP || '8801925112444';
};

// Background initial load
fetchSupportWhatsAppFromDB().catch(() => {});

const setCachedSupportWhatsApp = (num) => {
  if (num) {
    cachedSupportWhatsApp = String(num).trim();
    lastSettingsFetch = Date.now();
  }
};

/**
 * Reusable WhatsApp Contact Section for Email Bodies
 * Displays the Bengali support message and WhatsApp number loaded from settings
 */
const getWhatsAppContactBlock = (isDark = true, customNumber = null) => {
  const rawNumber = customNumber || cachedSupportWhatsApp || process.env.SUPPORT_WHATSAPP || '8801925112444';
  const { clean, display } = formatWhatsApp(rawNumber);
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return `
    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid ${borderColor}; font-size: 12px; line-height: 1.55; color: ${textColor}; word-break: normal; overflow-wrap: break-word; word-wrap: break-word; hyphens: none; -webkit-hyphens: none;" class="email-whatsapp-support-box">
      <p style="margin: 0 0 6px 0; font-size: 12px; line-height: 1.55; color: ${textColor}; word-break: normal; overflow-wrap: break-word;">
        আবারও ধন্যবাদ! আপনার অর্ডার সংক্রান্ত কোনো সাহায্যের প্রয়োজন হলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন এই ঠিকানায়
      </p>
      <div style="margin-top: 4px;">
        <a href="https://wa.me/${clean}" target="_blank" style="color: #22c55e; font-weight: 700; font-size: 13.5px; text-decoration: none; display: inline-block;">
          WhatsApp: ${display}
        </a>
      </div>
    </div>
  `;
};

/**
/**
 * Helper to escape HTML characters safely
 */
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Split text with inline bullets (■, •, ▪, etc.) or emojis into clean individual bullet lines
 */
const splitIntoBulletItems = (rawText) => {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) return [];

  // 1. Normalize line breaks & HTML
  let text = rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  // 2. Split inline bullets: if line has "■ " or "• " or "▪ ", break into new lines
  text = text
    .replace(/([।.?!\s]*)[■▪•●★►✔]\s*/g, '\n■ ')
    // Split before common emojis if preceded by punctuation or whitespace
    .replace(/([।.?!\s]+)([🤝📅⏳🛡️⚠️📌👉✅❌🔒🔑👤📧])/g, '$1\n$2');

  const rawLines = text.split(/\r?\n/);
  const items = [];

  for (const rawLine of rawLines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Check for dividers
    if (/^[─\-_=*~]{3,}$/.test(line)) {
      items.push({ type: 'divider' });
      continue;
    }

    // Check if line starts with an emoji
    const emojiMatch = line.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50]|[\u3030]|[\uFE0F]|[🤝📅⏳🛡️⚠️📌👉✅❌🔒🔑👤📧])\s*(.*)$/);
    if (emojiMatch && emojiMatch[1] && emojiMatch[2]) {
      items.push({ type: 'emoji', emoji: emojiMatch[1], text: emojiMatch[2].trim() });
      continue;
    }

    // Check if line starts with a bullet marker (strip it so we can render our custom bullet)
    const bulletMatch = line.match(/^[■▪•●★►✔\*\-]\s*(.*)$/);
    if (bulletMatch) {
      line = bulletMatch[1].trim();
    }

    if (!line) continue;

    items.push({ type: 'bullet', text: line });
  }

  return items;
};

/**
 * Format plain-text or multi-line product/license rules line-by-line into clean, compact, bulleted HTML
 */
const formatRulesHtml = (rulesText, isDark = true) => {
  if (!rulesText || typeof rulesText !== 'string' || !rulesText.trim()) return '';

  const textColor = isDark ? '#cbd5e1' : '#334155';
  const borderColor = isDark ? '#334155' : '#cbd5e1';

  const items = splitIntoBulletItems(rulesText);
  if (items.length === 0) return '';

  const rows = items.map((item) => {
    if (item.type === 'divider') {
      return `<div style="border-top: 1px dashed ${borderColor}; margin: 5px 0;"></div>`;
    }
    if (item.type === 'emoji') {
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 2px 0; border-collapse: collapse;">
          <tr>
            <td style="width: 18px; vertical-align: top; padding: 1.5px 3px 1.5px 0; font-size: 11px; line-height: 1.45; text-align: left;">${item.emoji}</td>
            <td style="vertical-align: top; padding: 1.5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.45; color: ${textColor}; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none;">
              ${escapeHtml(item.text)}
            </td>
          </tr>
        </table>
      `;
    }
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 2px 0; border-collapse: collapse;">
        <tr>
          <td style="width: 14px; vertical-align: top; padding: 1.5px 3px 1.5px 0; color: #10b981; font-size: 9.5px; line-height: 1.45; text-align: left;">▪</td>
          <td style="vertical-align: top; padding: 1.5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.45; color: ${textColor}; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none;">
            ${escapeHtml(item.text)}
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
    <div class="rules-box" style="background-color: ${isDark ? '#090d16' : '#f8fafc'}; border: 1px solid ${borderColor}; border-left: 3px solid #10b981; border-radius: 6px; padding: 8px 10px; margin: 8px 0; text-align: left; box-sizing: border-box; width: 100%;">
      <div style="font-size: 9.5px; text-transform: uppercase; font-weight: 700; color: #34d399; letter-spacing: 0.5px; margin-bottom: 5px;">
        📋 Activation Rules & Guidelines:
      </div>
      ${rows}
    </div>
  `;
};

/**
 * Format License Key / Account Credentials intelligently:
 * - If single license code: bold prominent monospace code
 * - If multi-line credentials with rules/bullets: clean credential rows + bulleted instructions
 */
const formatLicenseKeyHtml = (rawKey, isDark = true) => {
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
    return '<span style="color: #94a3b8; font-size: 11px;">N/A</span>';
  }

  const trimmed = rawKey.trim();
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subColor = isDark ? '#cbd5e1' : '#334155';

  // Check if it's purely a single-line key without rules (no bullets, no newlines, no Bengali)
  const isSimpleKey = !trimmed.includes('\n') &&
    !/[■▪•●★►✔]/.test(trimmed) &&
    !/[\u0980-\u09FF]/.test(trimmed) &&
    trimmed.length < 120;

  if (isSimpleKey) {
    return `
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; font-weight: 700; color: #34d399; letter-spacing: 0.6px; word-break: break-all; text-align: left; padding: 2px 0;">
        ${escapeHtml(trimmed)}
      </div>
    `;
  }

  // Parse lines/bullets
  const items = splitIntoBulletItems(trimmed);
  if (items.length === 0) {
    return `<div style="font-size: 11px; color: ${textColor};">${escapeHtml(trimmed)}</div>`;
  }

  const renderedRows = items.map((item) => {
    if (item.type === 'divider') {
      return `<div style="border-top: 1px dashed ${isDark ? '#334155' : '#cbd5e1'}; margin: 5px 0;"></div>`;
    }

    // Check if this line is a credential key:value pair (e.g. Email: ..., Password: ..., Profile: ...)
    const isCredLine = /^(email|mail|user|username|id|pass|password|pin|key|license|code|profile|link|url)\s*[:=]/i.test(item.text);

    if (isCredLine) {
      return `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11.5px; font-weight: 600; color: #34d399; background-color: ${isDark ? '#090d16' : '#f1f5f9'}; padding: 4px 6px; border-radius: 4px; margin: 2px 0; word-break: break-all; border-left: 2px solid #10b981;">
          ${escapeHtml(item.text)}
        </div>
      `;
    }

    if (item.type === 'emoji') {
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 2px 0; border-collapse: collapse;">
          <tr>
            <td style="width: 18px; vertical-align: top; padding: 1.5px 3px 1.5px 0; font-size: 11px; line-height: 1.45; text-align: left;">${item.emoji}</td>
            <td style="vertical-align: top; padding: 1.5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.45; color: ${subColor}; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none;">
              ${escapeHtml(item.text)}
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 2px 0; border-collapse: collapse;">
        <tr>
          <td style="width: 14px; vertical-align: top; padding: 1.5px 3px 1.5px 0; color: #10b981; font-size: 9.5px; line-height: 1.45; text-align: left;">▪</td>
          <td style="vertical-align: top; padding: 1.5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.45; color: ${subColor}; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none;">
            ${escapeHtml(item.text)}
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return renderedRows;
};

/**
 * Reusable Standard Footer for All Emails
 */
const getEmailFooter = (appName = (process.env.APP_NAME || 'ElitePassBD'), isDark = true) => {
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const subColor = isDark ? '#64748b' : '#94a3b8';
  const logoUrl = process.env.EMAIL_LOGO_URL || 'cid:brand_logo';

  return `
    <tr>
      <td class="footer-cell" style="background-color: ${bgColor}; padding: 18px 14px; text-align: center; font-size: 11.5px; border-top: 1px solid ${borderColor}; line-height: 1.5; word-break: normal; overflow-wrap: break-word;">
        <div style="margin-bottom: 6px; text-align: center;">
          <img src="${logoUrl}" alt="${appName}" width="150" style="width: 150px; max-width: 100%; height: auto; display: inline-block; vertical-align: middle; border: 0; outline: none; text-decoration: none;" />
        </div>
        <div style="color: ${subColor}; font-size: 11.5px; font-weight: 500; letter-spacing: 0.2px;">Dhaka, Bangladesh</div>
      </td>
    </tr>
  `;
};

/**
 * Plain-text version of the WhatsApp support message loaded from settings
 */
const getWhatsAppContactText = (customNumber = null) => {
  const rawNumber = customNumber || cachedSupportWhatsApp || process.env.SUPPORT_WHATSAPP || '8801925112444';
  const { display } = formatWhatsApp(rawNumber);
  return `\n\nআবারও ধন্যবাদ! আপনার অর্ডার সংক্রান্ত কোনো সাহায্যের প্রয়োজন হলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন এই ঠিকানায়\nWhatsApp: ${display}\n\nDhaka, Bangladesh`;
};

/**
 * Dynamically inject the latest WhatsApp support number from settings into email HTML & text
 */
const injectFreshSupportWhatsApp = async (html, text) => {
  const rawNumber = await fetchSupportWhatsAppFromDB(true);
  const { clean, display } = formatWhatsApp(rawNumber);

  let processedHtml = html;
  if (processedHtml && typeof processedHtml === 'string') {
    // 1. Replace any wa.me link inside the support section or throughout email
    processedHtml = processedHtml.replace(/href=["']https:\/\/wa\.me\/[0-9+]+["']/gi, `href="https://wa.me/${clean}"`);
    
    // 2. Replace any WhatsApp: +... or WhatsApp: 01... visible text
    processedHtml = processedHtml.replace(/(WhatsApp:\s*(?:<[^>]+>)*)\+?[0-9\s-]+((?:<\/[^>]+>)*)/gi, `$1${display}$2`);
    
    // 3. Replace any placeholder
    processedHtml = processedHtml
      .replace(/%%SUPPORT_WHATSAPP_CLEAN%%/g, clean)
      .replace(/%%SUPPORT_WHATSAPP_DISPLAY%%/g, display);
  }

  let processedText = text;
  if (processedText && typeof processedText === 'string') {
    processedText = processedText.replace(/WhatsApp:\s*\+?[0-9\s-]+/gi, `WhatsApp: ${display}`);
    processedText = processedText
      .replace(/%%SUPPORT_WHATSAPP_CLEAN%%/g, clean)
      .replace(/%%SUPPORT_WHATSAPP_DISPLAY%%/g, display);
  }

  return { html: processedHtml, text: processedText, clean, display };
};

const sendEmailDetailed = async ({ to, subject, text, html, attachments }) => {
  try {
    // Ensure latest support WhatsApp number is loaded from settings and dynamically applied
    const injected = await injectFreshSupportWhatsApp(html, text);
    const finalHtml = injected.html;
    const finalText = injected.text;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort == 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'ElitePassBD'}" <${smtpUser}>`,
        to,
        subject,
        text: finalText,
        html: finalHtml
      };

      const finalAttachments = Array.isArray(attachments) ? [...attachments] : [];

      // Automatically attach inline brand logo if email HTML references cid:brand_logo
      if (finalHtml && typeof finalHtml === 'string' && finalHtml.includes('cid:brand_logo')) {
        const logoPath = path.join(__dirname, '../public/logo_banner.png');
        if (fs.existsSync(logoPath) && !finalAttachments.some(a => a.cid === 'brand_logo')) {
          finalAttachments.push({
            filename: 'logo_banner.png',
            path: logoPath,
            cid: 'brand_logo',
            contentDisposition: 'inline'
          });
        }
      }

      if (finalAttachments.length > 0) {
        mailOptions.attachments = finalAttachments;
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(`[Mailer] SMTP credentials not configured in .env. Skipping email to ${to}`);
      return { success: false, error: 'SMTP credentials not configured in .env' };
    }
  } catch (err) {
    console.error(`[Mailer Error] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Standard sendEmail returning boolean (true / false) for 100% backward compatibility
const sendEmail = async (options) => {
  const result = await sendEmailDetailed(options);
  return !!(result && result.success);
};

module.exports = {
  sendEmail,
  sendEmailDetailed,
  getWhatsAppContactBlock,
  getEmailFooter,
  getWhatsAppContactText,
  formatRulesHtml,
  formatLicenseKeyHtml,
  setCachedSupportWhatsApp,
  fetchSupportWhatsAppFromDB,
  formatWhatsApp,
  injectFreshSupportWhatsApp
};
