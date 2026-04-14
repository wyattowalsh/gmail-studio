function buildPlainTextFallback(payload) {
  const lines = [];

  if (payload.preview_text) {
    lines.push(payload.preview_text, '');
  }

  lines.push(payload.headline, '');

  const bodyText = payload.body_text || htmlToPlainText(payload.body_html || '');
  if (bodyText) {
    lines.push(bodyText, '');
  }

  if (payload.cta_text && payload.cta_url) {
    lines.push(payload.cta_text + ': ' + payload.cta_url, '');
  }

  [payload.footer_note, payload.footer_company, payload.footer_address]
    .filter(Boolean)
    .forEach(function (part, idx, arr) {
      if (idx === 0) lines.push('—');
      lines.push(part);
    });

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToPlainText(html) {
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*p[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
