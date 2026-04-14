const emailSenderController_ =
  typeof require === 'function' ? require('../controllers/EmailSenderController') : globalThis || {};

function sendSingleEmail(payload) {
  return emailSenderController_.sendSingleEmail(payload);
}

function createSingleDraft(payload) {
  return emailSenderController_.createSingleDraft(payload);
}

function sendTestComposeDraft() {
  return emailSenderController_.sendTestComposeDraft();
}

function sendComposeDraft() {
  return emailSenderController_.sendComposeDraft();
}

function createComposeDraft() {
  return emailSenderController_.createComposeDraft();
}

function sendSelectedOutboundRow() {
  return emailSenderController_.sendSelectedOutboundRow();
}

function createSelectedOutboundDraft() {
  return emailSenderController_.createSelectedOutboundDraft();
}

function getQuotaForecast() {
  return emailSenderController_.getQuotaForecast();
}

function sendUnsentBatch(isDryRun) {
  return emailSenderController_.sendUnsentBatch(isDryRun);
}

function sendScheduledBatch() {
  return emailSenderController_.sendScheduledBatch();
}

function createScheduledDraftBatch() {
  return emailSenderController_.createScheduledDraftBatch();
}

if (typeof module !== 'undefined') {
  module.exports = {
    createComposeDraft,
    createScheduledDraftBatch,
    createSelectedOutboundDraft,
    createSingleDraft,
    getQuotaForecast,
    sendComposeDraft,
    sendScheduledBatch,
    sendSelectedOutboundRow,
    sendSingleEmail,
    sendTestComposeDraft,
    sendUnsentBatch,
  };
}
