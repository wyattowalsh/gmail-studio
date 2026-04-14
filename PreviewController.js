function getPreviewHtml_() {
  const payload = normalizeAndValidatePayload(getComposePayload());
  return renderHtmlTemplate(payload.template_name || 'EmailTemplate', payload);
}

function getTemplateCatalogForUi_() {
  return getTemplateCatalog().map((template) => ({
    default: template.default,
    description: template.description,
    family: template.family,
    id: template.id,
    label: template.label,
    picker: template.picker,
    rank: template.rank,
    status: template.status,
    useCase: template.useCase,
  }));
}

function previewComposeDraft_() {
  const payload = normalizeAndValidatePayload(getComposePayload());
  showPreviewDialog_(payload, 'Compose Preview');
}

function previewSelectedOutboundRow_() {
  const payload = normalizeAndValidatePayload(getSelectedOutboundPayload());
  showPreviewDialog_(payload, 'Queue Preview');
}

function showPreviewDialog_(payload, title) {
  const htmlBody = renderHtmlTemplate(payload.template_name || 'EmailTemplate', payload);
  const textBody = buildPlainTextFallback(payload);

  const template = HtmlService.createTemplateFromFile('PreviewPage');
  template.preview = {
    subject: payload.subject,
    recipient: payload.recipient,
    htmlBody: htmlBody,
    textBody: textBody,
  };

  const output = template.evaluate().setWidth(900).setHeight(700);

  SpreadsheetApp.getUi().showModalDialog(output, title);
}

if (typeof module !== 'undefined') {
  module.exports = {
    getPreviewHtml: getPreviewHtml_,
    getTemplateCatalogForUi: getTemplateCatalogForUi_,
    previewComposeDraft: previewComposeDraft_,
    previewSelectedOutboundRow: previewSelectedOutboundRow_,
    showPreviewDialog_,
  };
}
