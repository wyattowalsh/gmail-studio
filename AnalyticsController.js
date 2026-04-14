// Simple base64 for a 1x1 transparent GIF pixel
const TRACKING_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const ANALYTICS_SUMMARY_CACHE_KEY = 'analytics:summary';
const ANALYTICS_TRENDS_CACHE_KEY = 'analytics:trends';

/**
 * Endpoint for web app to handle open/click tracking.
 */
function doGet_(e) {
  const params = e.parameter;
  const action = params.action; // 'open' or 'click'
  const email = params.e; // Base64 encoded email
  const url = params.url; // Base64 encoded url

  if (!action || !email) {
    return ContentService.createTextOutput('Invalid parameters.');
  }

  const decodedEmail = Utilities.newBlob(Utilities.base64DecodeWebSafe(email)).getDataAsString();
  const timestamp = new Date();

  if (action === 'open') {
    logAnalyticsEvent_(decodedEmail, 'OPEN', '');
    const decodedPixel = Utilities.newBlob(Utilities.base64Decode(TRACKING_PIXEL)).getDataAsString();
    return ContentService.createTextOutput(decodedPixel).setMimeType(ContentService.MimeType.GIF);
  } else if (action === 'click' && url) {
    const decodedUrl = Utilities.newBlob(Utilities.base64DecodeWebSafe(url)).getDataAsString();
    if (!isSafeTrackingUrl_(decodedUrl)) {
      return HtmlService.createHtmlOutput('<p>Invalid tracking URL.</p>');
    }
    logAnalyticsEvent_(decodedEmail, 'CLICK', decodedUrl);
    return HtmlService.createHtmlOutput(`<script>window.location.replace(${JSON.stringify(decodedUrl)});</script>`);
  }

  return ContentService.createTextOutput('Unknown action.');
}

function logAnalyticsEvent_(email, eventType, detail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Analytics');
  if (!sheet) {
    sheet = ss.insertSheet('Analytics');
    sheet.appendRow(['Timestamp', 'Email', 'Event Type', 'Detail']);
    if (typeof applyAnalyticsSheetTheme_ === 'function') {
      applyAnalyticsSheetTheme_(sheet);
    } else {
      sheet.getRange('A1:D1').setFontWeight('bold');
    }
  }

  sheet.appendRow([new Date(), email, eventType, detail]);
  clearAnalyticsCaches_();
}

function getWebAppUrl_() {
  return ScriptApp.getService().getUrl();
}

function getAnalyticsSummary_() {
  const cached = getAnalyticsCache_().get(ANALYTICS_SUMMARY_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Analytics');
  if (!sheet) return { opens: 0, clicks: 0, total: 0 };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { opens: 0, clicks: 0, total: 0 };

  let opens = 0;
  let clicks = 0;

  for (let i = 1; i < data.length; i++) {
    const type = String(data[i][2]).toUpperCase();
    if (type === 'OPEN') opens++;
    if (type === 'CLICK') clicks++;
  }

  const summary = {
    opens: opens,
    clicks: clicks,
    total: data.length - 1,
  };

  getAnalyticsCache_().put(ANALYTICS_SUMMARY_CACHE_KEY, JSON.stringify(summary), 120);
  return summary;
}

function getAnalyticsTrends_() {
  const cached = getAnalyticsCache_().get(ANALYTICS_TRENDS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Analytics');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const trends = {};
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    trends[dateStr] = { opens: 0, clicks: 0 };
  }

  for (let i = 1; i < data.length; i++) {
    const timestamp = new Date(data[i][0]);
    if (timestamp < sevenDaysAgo) continue;

    const dateStr = timestamp.toISOString().split('T')[0];
    const type = String(data[i][2]).toUpperCase();

    if (trends[dateStr]) {
      if (type === 'OPEN') trends[dateStr].opens++;
      if (type === 'CLICK') trends[dateStr].clicks++;
    }
  }

  const result = Object.keys(trends)
    .sort()
    .map((date) => ({
      date: date,
      opens: trends[date].opens,
      clicks: trends[date].clicks,
    }));

  getAnalyticsCache_().put(ANALYTICS_TRENDS_CACHE_KEY, JSON.stringify(result), 120);
  return result;
}

function getAnalyticsCache_() {
  return CacheService.getScriptCache();
}

function clearAnalyticsCaches_() {
  const cache = getAnalyticsCache_();
  cache.remove(ANALYTICS_SUMMARY_CACHE_KEY);
  cache.remove(ANALYTICS_TRENDS_CACHE_KEY);
}

function isSafeTrackingUrl_(url) {
  return /^https?:\/\/[\w.-]/i.test(String(url || '').trim());
}

if (typeof module !== 'undefined') {
  module.exports = {
    clearAnalyticsCaches_,
    doGet: doGet_,
    getAnalyticsSummary: getAnalyticsSummary_,
    getAnalyticsTrends: getAnalyticsTrends_,
    getAnalyticsCache_,
    getWebAppUrl: getWebAppUrl_,
    logAnalyticsEvent: logAnalyticsEvent_,
    isSafeTrackingUrl_,
  };
}
