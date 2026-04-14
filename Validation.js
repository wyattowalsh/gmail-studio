function normalizeAndValidatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }

  const defaultTemplate = safeString(payload.default_template) || getDefaultTemplateId_();
  const defaultDeliveryMode = safeString(payload.default_delivery_mode || 'SEND').toUpperCase();
  const signatureEnabled = safeString(payload.signature_enabled || 'TRUE').toUpperCase() !== 'FALSE';
  const signatureData = buildSignatureData(payload);

  const p = {
    recipient: safeString(payload.recipient),
    subject: safeString(payload.subject),
    sender_name: safeString(payload.sender_name) || 'Wyatt Walsh',
    preview_text: safeString(payload.preview_text),
    first_name: safeString(payload.first_name),
    company: safeString(payload.company),
    headline: safeString(payload.headline),
    body_html: safeString(payload.body_html),
    body_text: safeString(payload.body_text),
    cta_text: safeString(payload.cta_text),
    cta_url: safeString(payload.cta_url),
    footer_note: safeString(payload.footer_note),
    footer_company: safeString(payload.footer_company),
    footer_address: safeString(payload.footer_address),
    from_alias: safeString(payload.from_alias),
    reply_to: safeString(payload.reply_to),
    signature_mode: safeString(payload.signature_mode || signatureData.signature_mode).toLowerCase(),
    signature_name: safeString(payload.signature_name || signatureData.signature_name),
    signature_email: safeString(payload.signature_email || signatureData.signature_email),
    signature_website_label: safeString(payload.signature_website_label || signatureData.signature_website_label),
    signature_website_href: safeString(payload.signature_website_href || signatureData.signature_website_href),
    signature_linkedin_label: safeString(payload.signature_linkedin_label || signatureData.signature_linkedin_label),
    signature_linkedin_href: safeString(payload.signature_linkedin_href || signatureData.signature_linkedin_href),
    signature_github_label: safeString(payload.signature_github_label || signatureData.signature_github_label),
    signature_github_href: safeString(payload.signature_github_href || signatureData.signature_github_href),
    signature_note: safeString(payload.signature_note || signatureData.signature_note),
    include_signature:
      safeString(payload.include_signature || (signatureEnabled ? 'TRUE' : 'FALSE')).toUpperCase() !== 'FALSE',
    attachment_ids: safeString(payload.attachment_ids),
    delivery_mode: safeString(payload.delivery_mode || defaultDeliveryMode).toUpperCase(),
    source_sheet: safeString(payload.source_sheet),
    source_row: Number(payload.source_row) || 0,
    sequence_id: safeString(payload.sequence_id),
    step_number: Number(payload.step_number) || 0,
    status: safeString(payload.status).toUpperCase(),
    template_name: resolveTemplateDefinition_(safeString(payload.template_name) || defaultTemplate).id,

    // A/B Testing Variants
    subject_a: safeString(payload.subject_a),
    subject_b: safeString(payload.subject_b),
    headline_a: safeString(payload.headline_a),
    headline_b: safeString(payload.headline_b),
    subject_variant: safeString(payload.subject_variant),
    headline_variant: safeString(payload.headline_variant),
  };

  const subjectSelection = selectVariant_({
    a: p.subject_a,
    b: p.subject_b,
    base: p.subject,
    seed: [p.recipient, p.source_sheet, p.source_row, 'subject'].join('::'),
  });
  p.subject = subjectSelection.value;
  p.subject_variant = subjectSelection.key;

  const headlineSelection = selectVariant_({
    a: p.headline_a,
    b: p.headline_b,
    base: p.headline,
    seed: [p.recipient, p.source_sheet, p.source_row, 'headline'].join('::'),
  });
  p.headline = headlineSelection.value;
  p.headline_variant = headlineSelection.key;

  if (!p.recipient) throw new Error('Missing recipient.');
  if (!isValidEmail(p.recipient)) throw new Error(`Invalid recipient: ${p.recipient}`);
  if (!p.subject) throw new Error('Missing subject.');
  if (!p.headline) throw new Error('Missing required field: headline.');
  if (!p.body_html && !p.body_text) {
    throw new Error('Provide body_html or body_text.');
  }

  if (!p.body_html && p.body_text) {
    p.body_html = parseMarkdownToHtml(p.body_text);
  }

  const hasCtaText = Boolean(p.cta_text);
  const hasCtaUrl = Boolean(p.cta_url);

  if (hasCtaText !== hasCtaUrl) {
    throw new Error('CTA requires both cta_text and cta_url.');
  }

  if (hasCtaUrl && !isValidHttpUrl(p.cta_url)) {
    throw new Error(`Invalid cta_url: ${p.cta_url}`);
  }

  if (p.reply_to && !isValidEmail(p.reply_to)) {
    throw new Error(`Invalid reply_to: ${p.reply_to}`);
  }

  if (p.from_alias && !isValidEmail(p.from_alias)) {
    throw new Error(`Invalid from_alias: ${p.from_alias}`);
  }

  if (p.signature_email && !isValidEmail(p.signature_email)) {
    throw new Error(`Invalid signature_email: ${p.signature_email}`);
  }

  [
    ['signature_website_href', p.signature_website_href],
    ['signature_linkedin_href', p.signature_linkedin_href],
    ['signature_github_href', p.signature_github_href],
  ].forEach(([fieldName, value]) => {
    if (value && !isValidHttpUrl(value)) {
      throw new Error(`Invalid ${fieldName}: ${value}`);
    }
  });

  const deliveryModes = typeof DELIVERY_MODES !== 'undefined' ? DELIVERY_MODES : ['SEND', 'DRAFT'];
  if (deliveryModes.indexOf(p.delivery_mode) === -1) {
    throw new Error(`Invalid delivery_mode: ${p.delivery_mode}`);
  }

  const signatureModes = typeof SIGNATURE_MODES !== 'undefined' ? SIGNATURE_MODES : ['compact', 'full'];
  if (signatureModes.indexOf(p.signature_mode) === -1) {
    throw new Error(`Invalid signature_mode: ${p.signature_mode}`);
  }

  return p;
}

function getDefaultTemplateId_() {
  return typeof getDefaultTemplateId === 'function' ? getDefaultTemplateId() : 'TemplatePersonalNote';
}

function resolveTemplateDefinition_(templateName) {
  if (typeof resolveTemplateDefinition === 'function') {
    return resolveTemplateDefinition(templateName);
  }

  return {
    file: String(templateName || getDefaultTemplateId_()),
    id: String(templateName || getDefaultTemplateId_()),
  };
}

function selectVariant_(options) {
  const variants = [
    { key: 'base', value: safeString(options.base) },
    { key: 'a', value: safeString(options.a) },
    { key: 'b', value: safeString(options.b) },
  ].filter((variant) => Boolean(variant.value));

  if (variants.length === 0) {
    return { key: '', value: '' };
  }

  if (variants.length === 1) {
    return variants[0];
  }

  return variants[stableHash_(options.seed) % variants.length];
}

function stableHash_(input) {
  const value = String(input || '');
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function parseMarkdownToHtml(text) {
  if (!text) return '';

  let html = text
    // Escaping basic HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Links: [text](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline;">$1</a>')
    // Line breaks to paragraphs
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return html;
}

function safeString(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidHttpUrl(value) {
  const s = String(value || '').trim();
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(s);
}

function textToParagraphHtml(text) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(function (paragraph) {
      return '<p style="Margin:0 0 16px 0;">' + paragraph.replace(/\n/g, '<br>') + '</p>';
    })
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalizeAndValidatePayload,
    safeString,
    isValidEmail,
    isValidHttpUrl,
    selectVariant_,
    stableHash_,
    textToParagraphHtml,
    escapeHtml,
  };
}
