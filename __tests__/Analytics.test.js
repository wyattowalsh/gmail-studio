describe('Analytics', () => {
  let analytics;
  let cache;
  let analyticsSheet;
  let spreadsheet;

  beforeEach(() => {
    jest.resetModules();

    cache = {
      get: jest.fn(),
      put: jest.fn(),
      remove: jest.fn(),
    };
    analyticsSheet = {
      appendRow: jest.fn(),
      getDataRange: jest.fn(),
      getRange: jest.fn().mockReturnValue({
        setFontWeight: jest.fn(),
      }),
    };
    spreadsheet = {
      getSheetByName: jest.fn().mockReturnValue(analyticsSheet),
      insertSheet: jest.fn().mockReturnValue(analyticsSheet),
    };

    global.CacheService = {
      getScriptCache: jest.fn().mockReturnValue(cache),
    };
    global.SpreadsheetApp = {
      getActiveSpreadsheet: jest.fn().mockReturnValue(spreadsheet),
    };
    global.ScriptApp = {
      getService: jest.fn().mockReturnValue({
        getUrl: jest.fn().mockReturnValue('https://script.google.com/macros/s/app/exec'),
      }),
    };
    global.ContentService = {
      MimeType: { GIF: 'image/gif' },
      createTextOutput: jest.fn((value) => ({
        setMimeType: jest.fn().mockReturnValue({ body: value, mimeType: 'image/gif' }),
        value: value,
      })),
    };
    global.HtmlService = {
      createHtmlOutput: jest.fn((html) => ({ html: html })),
    };
    global.Utilities = {
      base64Decode: jest.fn(),
      base64DecodeWebSafe: jest.fn((value) => [value]),
      newBlob: jest.fn((value) => ({
        getDataAsString: jest.fn().mockReturnValue(Array.isArray(value) ? value[0] : value),
      })),
    };

    analytics = require('../Analytics');
  });

  test('getAnalyticsSummary computes counts and caches the result', () => {
    analyticsSheet.getDataRange.mockReturnValue({
      getValues: jest.fn().mockReturnValue([
        ['Timestamp', 'Email', 'Event Type', 'Detail'],
        [new Date('2026-04-10T10:00:00.000Z'), 'a@example.com', 'OPEN', ''],
        [new Date('2026-04-10T11:00:00.000Z'), 'a@example.com', 'CLICK', 'https://example.com'],
        [new Date('2026-04-10T12:00:00.000Z'), 'b@example.com', 'open', ''],
      ]),
    });

    const summary = analytics.getAnalyticsSummary();

    expect(summary).toEqual({ clicks: 1, opens: 2, total: 3 });
    expect(cache.put).toHaveBeenCalledWith('analytics:summary', JSON.stringify(summary), 120);
  });

  test('getAnalyticsSummary returns cached data without hitting the sheet', () => {
    cache.get.mockReturnValueOnce(JSON.stringify({ clicks: 3, opens: 5, total: 8 }));

    const summary = analytics.getAnalyticsSummary();

    expect(summary).toEqual({ clicks: 3, opens: 5, total: 8 });
    expect(spreadsheet.getSheetByName).not.toHaveBeenCalled();
  });

  test('clearAnalyticsCaches_ removes both analytics cache keys', () => {
    analytics.clearAnalyticsCaches_();

    expect(cache.remove).toHaveBeenCalledWith('analytics:summary');
    expect(cache.remove).toHaveBeenCalledWith('analytics:trends');
  });

  test('isSafeTrackingUrl_ only accepts http and https destinations', () => {
    expect(analytics.isSafeTrackingUrl_('https://example.com/path')).toBe(true);
    expect(analytics.isSafeTrackingUrl_('http://example.com')).toBe(true);
    expect(analytics.isSafeTrackingUrl_('javascript:alert(1)')).toBe(false);
    expect(analytics.isSafeTrackingUrl_('data:text/html,<b>x</b>')).toBe(false);
  });
});
