function getPreviewController_() {
  if (typeof require === 'function') {
    return require('../controllers/PreviewController');
  }

  return {
    getPreviewHtml: typeof getPreviewHtml_ === 'function' ? getPreviewHtml_ : null,
    getTemplateCatalogForUi: typeof getTemplateCatalogForUi_ === 'function' ? getTemplateCatalogForUi_ : null,
    previewComposeDraft: typeof previewComposeDraft_ === 'function' ? previewComposeDraft_ : null,
    previewSelectedOutboundRow:
      typeof previewSelectedOutboundRow_ === 'function' ? previewSelectedOutboundRow_ : null,
  };
}

function invokePreviewController_(methodName, args) {
  const handler = getPreviewController_()[methodName];
  if (typeof handler !== 'function') {
    throw new Error(`Preview controller method "${methodName}" is unavailable.`);
  }

  return handler.apply(null, args || []);
}

function getPreviewHtml() {
  return invokePreviewController_('getPreviewHtml');
}

function getTemplateCatalogForUi() {
  return invokePreviewController_('getTemplateCatalogForUi');
}

function previewComposeDraft() {
  return invokePreviewController_('previewComposeDraft');
}

function previewSelectedOutboundRow() {
  return invokePreviewController_('previewSelectedOutboundRow');
}

if (typeof module !== 'undefined') {
  module.exports = {
    getPreviewHtml,
    getTemplateCatalogForUi,
    previewComposeDraft,
    previewSelectedOutboundRow,
  };
}
