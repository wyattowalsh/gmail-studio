const path = require('node:path');

const schemaPath = path.resolve(process.cwd(), 'src/gas/core/Schema.js');
const emailSenderControllerPath = path.resolve(process.cwd(), 'src/gas/controllers/EmailSenderController.js');
const { DELIVERY_MODES } = require(schemaPath);

describe('EmailSender', () => {
  let emailSender;
  let toast;
  let lock;
  let createDraft;

  beforeEach(() => {
    jest.resetModules();

    toast = jest.fn();
    lock = {
      waitLock: jest.fn(),
      releaseLock: jest.fn(),
    };
    createDraft = jest.fn().mockReturnValue({
      getId: jest.fn().mockReturnValue('draft-123'),
    });

    global.MailApp = {
      getRemainingDailyQuota: jest.fn(),
      sendEmail: jest.fn(),
    };
    global.GmailApp = {
      createDraft: createDraft,
      getAliases: jest.fn().mockReturnValue([]),
      sendEmail: jest.fn(),
    };
    global.DriveApp = {
      getFileById: jest.fn().mockReturnValue({
        getBlob: jest.fn().mockReturnValue({}),
      }),
    };
    global.SpreadsheetApp = {
      getActiveSpreadsheet: jest.fn().mockReturnValue({
        toast: toast,
      }),
    };
    global.Utilities = {
      base64EncodeWebSafe: jest.fn((value) => `b64:${value}`),
    };
    global.ScriptApp = {
      getService: jest.fn().mockReturnValue({
        getUrl: jest.fn().mockReturnValue('https://script.google.com/macros/s/app/exec'),
      }),
    };
    global.LockService = {
      getScriptLock: jest.fn().mockReturnValue(lock),
    };
    global.PropertiesService = {
      getScriptProperties: jest.fn().mockReturnValue({
        setProperties: jest.fn(),
      }),
    };

    global.getConfig = jest.fn().mockReturnValue({
      batch_headroom: '5',
      batch_max_size: '25',
    });
    global.getDispatchableOutboundPayloads = jest.fn();
    global.getUnsentOutboundPayloads = jest.fn();
    global.updateOutboundRows = jest.fn();
    global.normalizeAndValidatePayload = jest.fn((payload) => payload);
    global.renderHtmlTemplate = jest.fn().mockReturnValue('<html>body</html>');
    global.buildPlainTextFallback = jest.fn().mockReturnValue('plain text');
    global.getPlainTextSignature = jest.fn().mockReturnValue('\n\nSignature');
    global.handleSequenceNextStep = jest.fn();
    global.logAnalyticsEvent = jest.fn();
    global.getComposePayload = jest.fn();
    global.getSelectedOutboundPayload = jest.fn();

    emailSender = require(emailSenderControllerPath);
  });

  test('sendScheduledBatch sends only due SEND payloads within headroom-adjusted quota', () => {
    global.MailApp.getRemainingDailyQuota.mockReturnValue(12);
    global.getDispatchableOutboundPayloads.mockReturnValue(
      Array.from({ length: 20 }, (_, index) => ({
        __rowNumber: index + 2,
        body_html: '<p>Hello</p>',
        delivery_mode: DELIVERY_MODES[0],
        headline: `Headline ${index}`,
        recipient: `send-${index}@example.com`,
        status: 'SCHEDULED',
        subject: `Subject ${index}`,
      }))
    );

    const results = emailSender.sendScheduledBatch();

    expect(results).toHaveLength(7);
    expect(global.MailApp.sendEmail).toHaveBeenCalledTimes(7);
    expect(global.getDispatchableOutboundPayloads).toHaveBeenCalledWith(expect.any(Date), 'SEND');
    expect(global.updateOutboundRows).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('Sent 7 scheduled emails!', 'Gmail Studio');
    expect(lock.waitLock).toHaveBeenCalledWith(30000);
    expect(lock.releaseLock).toHaveBeenCalledTimes(1);
  });

  test('createScheduledDraftBatch drafts due DRAFT payloads without consuming quota', () => {
    global.getDispatchableOutboundPayloads.mockReturnValue([
      {
        __rowNumber: 2,
        body_text: 'Hello draft one',
        delivery_mode: 'DRAFT',
        headline: 'Headline 1',
        recipient: 'draft-one@example.com',
        status: 'SCHEDULED',
        subject: 'Subject 1',
      },
      {
        __rowNumber: 3,
        body_text: 'Hello draft two',
        delivery_mode: 'DRAFT',
        headline: 'Headline 2',
        recipient: 'draft-two@example.com',
        status: 'SCHEDULED',
        subject: 'Subject 2',
      },
    ]);

    const results = emailSender.createScheduledDraftBatch();

    expect(results).toEqual([
      expect.objectContaining({ draftId: 'draft-123', mode: 'DRAFT', ok: true, recipient: 'draft-one@example.com' }),
      expect.objectContaining({ draftId: 'draft-123', mode: 'DRAFT', ok: true, recipient: 'draft-two@example.com' }),
    ]);
    expect(global.MailApp.getRemainingDailyQuota).not.toHaveBeenCalled();
    expect(createDraft).toHaveBeenCalledTimes(2);
    expect(global.handleSequenceNextStep).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('Created 2 scheduled drafts.', 'Gmail Studio');
  });

  test('deliverSingleEmail_ skips quota and sequence advancement for draft mode', () => {
    const result = emailSender.deliverSingleEmail_(
      {
        body_text: 'Draft body',
        delivery_mode: 'DRAFT',
        headline: 'Draft headline',
        recipient: 'draft@example.com',
        subject: 'Draft subject',
      },
      'DRAFT'
    );

    expect(result).toEqual({
      draftId: 'draft-123',
      mode: 'DRAFT',
      ok: true,
      recipient: 'draft@example.com',
      subject: 'Draft subject',
    });
    expect(global.MailApp.getRemainingDailyQuota).not.toHaveBeenCalled();
    expect(global.MailApp.sendEmail).not.toHaveBeenCalled();
    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(global.handleSequenceNextStep).not.toHaveBeenCalled();
  });
});
