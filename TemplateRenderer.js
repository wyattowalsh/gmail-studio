/**
 * Renders an HTML template from an Apps Script file.
 */
function renderHtmlTemplate(templateName, data) {
  const resolvedTemplate =
    typeof resolveTemplateDefinition === 'function'
      ? resolveTemplateDefinition(templateName)
      : { file: String(templateName || 'EmailTemplate'), id: String(templateName || 'EmailTemplate') };
  let template = HtmlService.createTemplateFromFile(resolvedTemplate.file);
  let include;

  include = function (filename) {
    const partial = HtmlService.createTemplateFromFile(filename);
    Object.keys(data).forEach((key) => {
      partial[key] = data[key];
    });
    partial.template_meta = resolvedTemplate;
    partial.include = include;
    return partial.evaluate().getContent();
  };

  // Assign data fields
  Object.keys(data).forEach((key) => {
    template[key] = data[key];
  });
  template.template_meta = resolvedTemplate;

  // Helpers
  template.include = include;

  return template.evaluate().getContent();
}

if (typeof module !== 'undefined') {
  module.exports = {
    renderHtmlTemplate,
  };
}
