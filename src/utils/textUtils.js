/**
 * Converts HTML-formatted rules or rich text into clean, readable plain text.
 * Strips HTML tags (<p>, <strong>, <h3>, etc.), decodes entities, and preserves line breaks.
 */
export const htmlToPlainText = (html) => {
  if (!html || typeof html !== 'string') return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;

  let text = html;

  // Replace block endings and breaks with newlines
  text = text
    .replace(/<\/(h[1-6]|p|div|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<hr\s*\/?>/gi, '\n─────────────────────────────────────────────\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&bull;/gi, '•');

  // Normalize line breaks & trailing whitespace per line
  const lines = text.split('\n').map((l) => l.trim());

  // Condense 3+ newlines to max 2 and trim
  text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return text;
};

