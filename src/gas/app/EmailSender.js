function sendSingleEmail(payload) {
  return deliverSingleEmail_(payload, 'SEND');
}

function createSingleDraft(payload) {
  return deliverSingleEmail_(payload, 'DRAFT');
}

function deliverSingleEmail_(payload, requestedMode) {
  const p = normalizeAndValidatePayload(payload);
  const deliveryMode = String(requestedMode || p.delivery_mode || 'SEND')
    .trim()
    .toUpperCase();

  if (deliveryMode === 'SEND') {
    const remaining = MailApp.getRemainingDailyQuota();
    if (remaining < 1) {
      throw new Error('No remaining daily email quota.');
    }
  }

  const message = buildDeliveryMessage_(p);
  const result = deliveryMode === 'DRAFT' ? createDraft_(p, message) : sendMessage_(p, message);

  if (deliveryMode === 'SEND') {
    try {
      handleSequenceNextStep(p);
    } catch (e) {
      console.error('Sequence Error:', e.message);
    }
  }

  return result;
}

function buildDeliveryMessage_(payload) {
  let htmlBody = renderHtmlTemplate(payload.template_name || 'EmailTemplate', payload);
  const textBody = buildPlainTextMessage_(payload);

  if (isTrackingEnabled_(payload)) {
    try {
      const webAppUrl = ScriptApp.getService().getUrl();
      if (webAppUrl) {
        const b64Email = Utilities.base64EncodeWebSafe(payload.recipient);
        const pixelUrl = `${webAppUrl}?action=open&e=${b64Email}`;
        htmlBody += `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

        if (payload.cta_url) {
          const b64Url = Utilities.base64EncodeWebSafe(payload.cta_url);
          const trackingUrl = `${webAppUrl}?action=click&e=${b64Email}&url=${b64Url}`;
          htmlBody = htmlBody.replace(payload.cta_url, trackingUrl);
        }
      }
    } catch (e) {
      console.error('Tracking setup error:', e.message);
    }
  }

  const options = {
    attachments: loadAttachments_(payload),
    body: textBody,
    htmlBody: htmlBody,
    name: payload.sender_name,
    replyTo: payload.reply_to || undefined,
    subject: payload.subject,
    to: payload.recipient,
  };

  if (!options.attachments || options.attachments.length === 0) {
    delete options.attachments;
  }

  return options;
}

function buildPlainTextMessage_(payload) {
  const message = buildPlainTextFallback(payload);
  if (!payload.include_signature) {
    return message;
  }

  return (message + getPlainTextSignature(payload)).replace(/\n{3,}/g, '\n\n').trim();
}

function loadAttachments_(payload) {
  if (!payload.attachment_ids) {
    return [];
  }

  return payload.attachment_ids
    .split(',')
    .map(function (id) {
      return id.trim();
    })
    .filter(Boolean)
    .map(function (id) {
      try {
        return DriveApp.getFileById(id).getBlob();
      } catch (e) {
        throw new Error('Failed to load attachment with ID ' + id + ': ' + e.message);
      }
    });
}

function validateFromAlias_(fromAlias) {
  if (!fromAlias) {
    return '';
  }

  const aliases = GmailApp.getAliases();
  if (aliases.indexOf(fromAlias) === -1) {
    throw new Error('Configured from_alias is not one of the available Gmail aliases.');
  }

  return fromAlias;
}

function sendMessage_(payload, message) {
  const fromAlias = validateFromAlias_(payload.from_alias);
  if (fromAlias) {
    GmailApp.sendEmail(message.to, message.subject, message.body, {
      attachments: message.attachments,
      from: fromAlias,
      htmlBody: message.htmlBody,
      name: message.name,
      replyTo: message.replyTo,
    });
  } else {
    MailApp.sendEmail(message);
  }

  logDeliveryEvent_(
    payload,
    'SEND',
    JSON.stringify({
      delivery_mode: 'SEND',
      from_alias: fromAlias,
      headline_variant: payload.headline_variant,
      subject_variant: payload.subject_variant,
      template_name: payload.template_name,
    })
  );

  return {
    ok: true,
    mode: 'SEND',
    recipient: payload.recipient,
    subject: payload.subject,
  };
}

function createDraft_(payload, message) {
  const draftOptions = {
    attachments: message.attachments,
    from: validateFromAlias_(payload.from_alias) || undefined,
    htmlBody: message.htmlBody,
    name: message.name,
    replyTo: message.replyTo,
  };
  const draft = GmailApp.createDraft(message.to, message.subject, message.body, draftOptions);

  logDeliveryEvent_(
    payload,
    'DRAFT',
    JSON.stringify({
      delivery_mode: 'DRAFT',
      draft_id: draft.getId(),
      from_alias: draftOptions.from || '',
      headline_variant: payload.headline_variant,
      subject_variant: payload.subject_variant,
      template_name: payload.template_name,
    })
  );

  return {
    ok: true,
    draftId: draft.getId(),
    mode: 'DRAFT',
    recipient: payload.recipient,
    subject: payload.subject,
  };
}

function logDeliveryEvent_(payload, eventType, detail) {
  if (!isTrackingEnabled_(payload)) {
    return;
  }

  try {
    logAnalyticsEvent(payload.recipient, eventType, detail);
  } catch (e) {
    console.error('Analytics log error:', e.message);
  }
}

function isTrackingEnabled_(payload) {
  return (
    String(payload.tracking_enabled || 'FALSE')
      .trim()
      .toUpperCase() === 'TRUE'
  );
}

function withQueueLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getBatchSettings_() {
  const config = getConfig();
  return {
    batchHeadroom: Math.max(0, Number(config.batch_headroom) || 0),
    batchMaxSize: Math.max(1, Number(config.batch_max_size) || 25),
  };
}

function selectBatchPayloads_(options) {
  const now = new Date();
  const mode = String(options.deliveryMode || 'SEND')
    .trim()
    .toUpperCase();
  const respectSchedule = Boolean(options.respectSchedule);
  const eligible = respectSchedule
    ? getDispatchableOutboundPayloads(now, mode)
    : getUnsentOutboundPayloads().filter((payload) => {
        const rowMode = String(payload.delivery_mode || 'SEND')
          .trim()
          .toUpperCase();
        const status = String(payload.status || '')
          .trim()
          .toUpperCase();
        return (
          rowMode === mode && status !== 'DRY_RUN' && status !== 'DRAFTED' && status !== 'ERROR' && status !== 'SENT'
        );
      });

  if (mode === 'DRAFT') {
    return eligible;
  }

  const remaining = MailApp.getRemainingDailyQuota();
  const settings = getBatchSettings_();
  const availableQuota = Math.max(0, remaining - settings.batchHeadroom);

  return eligible.slice(0, Math.min(settings.batchMaxSize, availableQuota, eligible.length));
}

function writeBatchCheckpoint_(metadata) {
  try {
    PropertiesService.getScriptProperties().setProperties({
      LAST_BATCH_AT: new Date().toISOString(),
      LAST_BATCH_MODE: String(metadata.deliveryMode || ''),
      LAST_BATCH_PROCESSED: String(metadata.processed || 0),
      LAST_BATCH_STATUS: String(metadata.status || ''),
    });
  } catch (e) {
    console.error('Checkpoint write error:', e.message);
  }
}

function processOutboundBatch_(options) {
  return withQueueLock_(function () {
    const deliveryMode = String(options.deliveryMode || 'SEND')
      .trim()
      .toUpperCase();
    const dryRun = Boolean(options.dryRun);
    const payloads = selectBatchPayloads_(options);

    if (payloads.length === 0) {
      writeBatchCheckpoint_({ deliveryMode: deliveryMode, processed: 0, status: 'EMPTY' });
      return [];
    }

    const results = [];
    const updates = [];

    payloads.forEach(function (payload) {
      try {
        if (dryRun) {
          results.push({ ok: true, recipient: payload.recipient, dryRun: true });
          updates.push({
            rowNumber: payload.__rowNumber,
            patch: {
              error: 'Validated successfully',
              last_attempt_at: new Date(),
              status: 'DRY_RUN',
            },
          });
          return;
        }

        const result = deliveryMode === 'DRAFT' ? createSingleDraft(payload) : sendSingleEmail(payload);
        results.push(result);

        updates.push({
          rowNumber: payload.__rowNumber,
          patch: {
            drafted_at: result.mode === 'DRAFT' ? new Date() : payload.drafted_at || '',
            draft_id: result.draftId || '',
            error: '',
            last_attempt_at: new Date(),
            sent_at: result.mode === 'SEND' ? new Date() : payload.sent_at || '',
            status: result.mode === 'DRAFT' ? 'DRAFTED' : 'SENT',
          },
        });
      } catch (err) {
        const message = err.message || String(err);
        updates.push({
          rowNumber: payload.__rowNumber,
          patch: {
            error: message,
            last_attempt_at: new Date(),
            status: 'ERROR',
          },
        });
        logDeliveryEvent_(payload, 'ERROR', message);
      }
    });

    updateOutboundRows(updates);
    writeBatchCheckpoint_({ deliveryMode: deliveryMode, processed: payloads.length, status: 'OK' });
    return results;
  });
}

function sendTestComposeDraft() {
  const payload = getComposePayload();
  payload.recipient = 'wyattowalsh@gmail.com';
  return sendSingleEmail(payload);
}

function sendComposeDraft() {
  const payload = getComposePayload();
  return sendSingleEmail(payload);
}

function createComposeDraft() {
  const payload = getComposePayload();
  return createSingleDraft(payload);
}

function sendSelectedOutboundRow() {
  return withQueueLock_(function () {
    const payload = getSelectedOutboundPayload();
    const result = sendSingleEmail(payload);
    updateOutboundRows([
      {
        rowNumber: payload.__rowNumber,
        patch: {
          error: '',
          last_attempt_at: new Date(),
          sent_at: new Date(),
          status: 'SENT',
        },
      },
    ]);
    return result;
  });
}

function createSelectedOutboundDraft() {
  return withQueueLock_(function () {
    const payload = getSelectedOutboundPayload();
    const result = createSingleDraft(payload);
    updateOutboundRows([
      {
        rowNumber: payload.__rowNumber,
        patch: {
          draft_id: result.draftId,
          drafted_at: new Date(),
          error: '',
          last_attempt_at: new Date(),
          status: 'DRAFTED',
        },
      },
    ]);
    return result;
  });
}

function getQuotaForecast() {
  const remaining = MailApp.getRemainingDailyQuota();
  const unsentPayloads = getUnsentOutboundPayloads();
  const scheduled = unsentPayloads.filter((payload) => Boolean(payload.scheduled_time)).length;
  const sendReady = selectBatchPayloads_({ deliveryMode: 'SEND', respectSchedule: true }).length;
  const draftReady = getDispatchableOutboundPayloads(new Date(), 'DRAFT').length;

  return {
    draft_ready_now: draftReady,
    remaining: remaining,
    send_ready_now: sendReady,
    unsent_total: unsentPayloads.length,
    scheduled_future: scheduled,
    is_at_risk: remaining < unsentPayloads.length,
  };
}

function sendUnsentBatch(isDryRun = false) {
  return processOutboundBatch_({ deliveryMode: 'SEND', dryRun: isDryRun, respectSchedule: false });
}

function sendScheduledBatch() {
  const results = processOutboundBatch_({ deliveryMode: 'SEND', respectSchedule: true });

  if (results.length > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Sent ${results.length} scheduled emails!`, 'Gmail Studio');
  }

  return results;
}

function createScheduledDraftBatch() {
  const results = processOutboundBatch_({ deliveryMode: 'DRAFT', respectSchedule: true });
  if (results.length > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Created ${results.length} scheduled drafts.`, 'Gmail Studio');
  }
  return results;
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildDeliveryMessage_,
    createComposeDraft,
    createScheduledDraftBatch,
    createSelectedOutboundDraft,
    createSingleDraft,
    deliverSingleEmail_,
    getBatchSettings_,
    isTrackingEnabled_,
    sendSingleEmail,
    sendTestComposeDraft,
    sendComposeDraft,
    sendSelectedOutboundRow,
    sendUnsentBatch,
    sendScheduledBatch,
    selectBatchPayloads_,
  };
}
