function getEmailSenderController_() {
  if (typeof require === 'function') {
    return require('../controllers/EmailSenderController');
  }

  return {
    createComposeDraft: typeof createComposeDraft_ === 'function' ? createComposeDraft_ : null,
    createScheduledDraftBatch: typeof createScheduledDraftBatch_ === 'function' ? createScheduledDraftBatch_ : null,
    createSelectedOutboundDraft:
      typeof createSelectedOutboundDraft_ === 'function' ? createSelectedOutboundDraft_ : null,
    createSingleDraft: typeof createSingleDraft_ === 'function' ? createSingleDraft_ : null,
    getQuotaForecast: typeof getQuotaForecast_ === 'function' ? getQuotaForecast_ : null,
    sendComposeDraft: typeof sendComposeDraft_ === 'function' ? sendComposeDraft_ : null,
    sendScheduledBatch: typeof sendScheduledBatch_ === 'function' ? sendScheduledBatch_ : null,
    sendSelectedOutboundRow: typeof sendSelectedOutboundRow_ === 'function' ? sendSelectedOutboundRow_ : null,
    sendSingleEmail: typeof sendSingleEmail_ === 'function' ? sendSingleEmail_ : null,
    sendTestComposeDraft: typeof sendTestComposeDraft_ === 'function' ? sendTestComposeDraft_ : null,
    sendUnsentBatch: typeof sendUnsentBatch_ === 'function' ? sendUnsentBatch_ : null,
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
