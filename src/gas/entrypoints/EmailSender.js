function getEmailSenderController_() {
  if (typeof require === 'function') {
    return require('../controllers/EmailSenderController');
  }

  return {
    createComposeDraft: typeof globalThis.createComposeDraft_ === 'function' ? globalThis.createComposeDraft_ : null,
    createScheduledDraftBatch:
      typeof globalThis.createScheduledDraftBatch_ === 'function' ? globalThis.createScheduledDraftBatch_ : null,
    createSelectedOutboundDraft:
      typeof globalThis.createSelectedOutboundDraft_ === 'function' ? globalThis.createSelectedOutboundDraft_ : null,
    createSingleDraft: typeof globalThis.createSingleDraft_ === 'function' ? globalThis.createSingleDraft_ : null,
    getQuotaForecast: typeof globalThis.getQuotaForecast_ === 'function' ? globalThis.getQuotaForecast_ : null,
    sendComposeDraft: typeof globalThis.sendComposeDraft_ === 'function' ? globalThis.sendComposeDraft_ : null,
    sendScheduledBatch: typeof globalThis.sendScheduledBatch_ === 'function' ? globalThis.sendScheduledBatch_ : null,
    sendSelectedOutboundRow:
      typeof globalThis.sendSelectedOutboundRow_ === 'function' ? globalThis.sendSelectedOutboundRow_ : null,
    sendSingleEmail: typeof globalThis.sendSingleEmail_ === 'function' ? globalThis.sendSingleEmail_ : null,
    sendTestComposeDraft:
      typeof globalThis.sendTestComposeDraft_ === 'function' ? globalThis.sendTestComposeDraft_ : null,
    sendUnsentBatch: typeof globalThis.sendUnsentBatch_ === 'function' ? globalThis.sendUnsentBatch_ : null,
  };
}

function invokeEmailSenderController_(methodName, args) {
  const handler = getEmailSenderController_()[methodName];
  if (typeof handler !== 'function') {
    throw new Error(`Email sender controller method "${methodName}" is unavailable.`);
  }

  return handler.apply(null, args || []);
}

function sendSingleEmail(payload) {
  return invokeEmailSenderController_('sendSingleEmail', [payload]);
}

function createSingleDraft(payload) {
  return invokeEmailSenderController_('createSingleDraft', [payload]);
}

function sendTestComposeDraft() {
  return invokeEmailSenderController_('sendTestComposeDraft');
}

function sendComposeDraft() {
  return invokeEmailSenderController_('sendComposeDraft');
}

function createComposeDraft() {
  return invokeEmailSenderController_('createComposeDraft');
}

function sendSelectedOutboundRow() {
  return invokeEmailSenderController_('sendSelectedOutboundRow');
}

function createSelectedOutboundDraft() {
  return invokeEmailSenderController_('createSelectedOutboundDraft');
}

function getQuotaForecast() {
  return invokeEmailSenderController_('getQuotaForecast');
}

function sendUnsentBatch(isDryRun) {
  return invokeEmailSenderController_('sendUnsentBatch', [isDryRun]);
}

function sendScheduledBatch() {
  return invokeEmailSenderController_('sendScheduledBatch');
}

function createScheduledDraftBatch() {
  return invokeEmailSenderController_('createScheduledDraftBatch');
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
