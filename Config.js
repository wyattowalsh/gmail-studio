const DEFAULT_CONFIG = Object.freeze({
  batch_headroom: '5',
  batch_max_size: '25',
  default_delivery_mode: 'DRAFT',
  default_template: 'TemplatePersonalNote',
  from_alias: '',
  reply_to: 'wyattowalsh@gmail.com',
  sender_name: 'Wyatt Walsh',
  signature_email: 'wyattowalsh@gmail.com',
  signature_enabled: 'TRUE',
  signature_github_href: 'https://github.com/wyattowalsh',
  signature_github_label: 'github.com/wyattowalsh',
  signature_linkedin_href: 'https://linkedin.com/in/wyattowalsh',
  signature_linkedin_label: 'linkedin.com/in/wyattowalsh',
  signature_mode: 'compact',
  signature_name: 'Wyatt Walsh',
  signature_note: '',
  signature_website_href: 'https://w4w.dev',
  signature_website_label: 'w4w.dev',
  tracking_enabled: 'FALSE',
  signature_text:
    '\n\n—\nWyatt Walsh\nwyattowalsh@gmail.com\nw4w.dev\nlinkedin.com/in/wyattowalsh\ngithub.com/wyattowalsh',
});

function getConfigDefaults() {
  return Object.assign({}, DEFAULT_CONFIG);
}

function buildSignatureData(config) {
  const defaults = getConfigDefaults();
  const settings = Object.assign({}, defaults, config || {});
  const signatureModes = typeof SIGNATURE_MODES !== 'undefined' ? SIGNATURE_MODES : ['compact', 'full'];
  const signatureMode = String(settings.signature_mode || defaults.signature_mode)
    .trim()
    .toLowerCase();
  const safeMode = signatureModes.indexOf(signatureMode) === -1 ? defaults.signature_mode : signatureMode;
  const senderName = String(settings.sender_name || defaults.sender_name).trim();
  const replyTo = String(settings.reply_to || defaults.reply_to).trim();

  return {
    signature_email: String(settings.signature_email || replyTo).trim(),
    signature_github_href: String(settings.signature_github_href || '').trim(),
    signature_github_label: String(settings.signature_github_label || '').trim(),
    signature_linkedin_href: String(settings.signature_linkedin_href || '').trim(),
    signature_linkedin_label: String(settings.signature_linkedin_label || '').trim(),
    signature_mode: safeMode,
    signature_name: String(settings.signature_name || senderName).trim(),
    signature_note: String(settings.signature_note || '').trim(),
    signature_website_href: String(settings.signature_website_href || '').trim(),
    signature_website_label: String(settings.signature_website_label || '').trim(),
  };
}

function getPlainTextSignature(config) {
  const defaults = getConfigDefaults();
  const settings = Object.assign({}, defaults, config || {});
  const signature = buildSignatureData(settings);
  const lines = [''];

  if (signature.signature_name) {
    lines.push('—', signature.signature_name);
  }

  if (signature.signature_note) {
    lines.push(signature.signature_note);
  }

  if (signature.signature_email) {
    lines.push(signature.signature_email);
  }

  if (signature.signature_website_label) {
    lines.push(signature.signature_website_label);
  }

  if (signature.signature_mode === 'full') {
    [signature.signature_linkedin_label, signature.signature_github_label].filter(Boolean).forEach((value) => {
      lines.push(value);
    });
  }

  const generated = lines.join('\n').trim();
  return generated || String(settings.signature_text || defaults.signature_text);
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_CONFIG,
    buildSignatureData,
    getConfigDefaults,
    getPlainTextSignature,
  };
}
