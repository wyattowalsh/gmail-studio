const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadEntrypoint(relativePath, sandbox) {
  const filePath = path.resolve(process.cwd(), relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const context = vm.createContext({ ...sandbox });

  vm.runInContext(source, context, { filename: filePath });
  return context;
}

describe('Apps Script entrypoint runtime fallback', () => {
  test('Menu entrypoint resolves underscored controller globals', () => {
    const onOpen_ = jest.fn();
    const context = loadEntrypoint('src/gas/entrypoints/Menu.js', {
      onOpen_: onOpen_,
      openSidebar_: jest.fn(),
      startScheduler_: jest.fn(),
      stopScheduler_: jest.fn(),
    });

    context.onOpen();

    expect(onOpen_).toHaveBeenCalledTimes(1);
  });

  test('Analytics entrypoint resolves underscored controller globals', () => {
    const doGet_ = jest.fn().mockReturnValue({ ok: true });
    const context = loadEntrypoint('src/gas/entrypoints/Analytics.js', {
      doGet_: doGet_,
      getAnalyticsSummary_: jest.fn(),
      getAnalyticsTrends_: jest.fn(),
      getWebAppUrl_: jest.fn(),
      logAnalyticsEvent_: jest.fn(),
    });

    const result = context.doGet({ parameter: { action: 'open' } });

    expect(doGet_).toHaveBeenCalledWith({ parameter: { action: 'open' } });
    expect(result).toEqual({ ok: true });
  });

  test('Automation entrypoint resolves underscored controller globals', () => {
    const onEdit_ = jest.fn();
    const event = { range: { getRow: jest.fn().mockReturnValue(3) } };
    const context = loadEntrypoint('src/gas/entrypoints/Automation.js', {
      onEdit_: onEdit_,
    });

    context.onEdit(event);

    expect(onEdit_).toHaveBeenCalledWith(event);
  });

  test('Email sender entrypoint resolves underscored controller globals', () => {
    const sendComposeDraft_ = jest.fn().mockReturnValue({ ok: true, mode: 'SEND' });
    const context = loadEntrypoint('src/gas/entrypoints/EmailSender.js', {
      createComposeDraft_: jest.fn(),
      createScheduledDraftBatch_: jest.fn(),
      createSelectedOutboundDraft_: jest.fn(),
      createSingleDraft_: jest.fn(),
      getQuotaForecast_: jest.fn(),
      sendComposeDraft_: sendComposeDraft_,
      sendScheduledBatch_: jest.fn(),
      sendSelectedOutboundRow_: jest.fn(),
      sendSingleEmail_: jest.fn(),
      sendTestComposeDraft_: jest.fn(),
      sendUnsentBatch_: jest.fn(),
    });

    const result = context.sendComposeDraft();

    expect(sendComposeDraft_).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, mode: 'SEND' });
  });

  test('Preview entrypoint resolves underscored controller globals', () => {
    const previewComposeDraft_ = jest.fn();
    const context = loadEntrypoint('src/gas/entrypoints/Preview.js', {
      getPreviewHtml_: jest.fn(),
      getTemplateCatalogForUi_: jest.fn(),
      previewComposeDraft_: previewComposeDraft_,
      previewSelectedOutboundRow_: jest.fn(),
    });

    context.previewComposeDraft();

    expect(previewComposeDraft_).toHaveBeenCalledTimes(1);
  });
});
