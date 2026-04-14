const previewController_ =
  typeof require === 'function' ? require('../controllers/PreviewController') : globalThis || {};

function getPreviewHtml() {
  return previewController_.getPreviewHtml();
}

function getTemplateCatalogForUi() {
  return previewController_.getTemplateCatalogForUi();
}

function previewComposeDraft() {
  return previewController_.previewComposeDraft();
}

function previewSelectedOutboundRow() {
  return previewController_.previewSelectedOutboundRow();
}

if (typeof module !== 'undefined') {
  module.exports = {
    getPreviewHtml,
    getTemplateCatalogForUi,
    previewComposeDraft,
    previewSelectedOutboundRow,
  };
}
