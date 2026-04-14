const analyticsController_ =
  typeof require === 'function' ? require('../controllers/AnalyticsController') : globalThis || {};

function doGet(e) {
  return analyticsController_.doGet(e);
}

function logAnalyticsEvent(email, eventType, detail) {
  return analyticsController_.logAnalyticsEvent(email, eventType, detail);
}

function getWebAppUrl() {
  return analyticsController_.getWebAppUrl();
}

function getAnalyticsSummary() {
  return analyticsController_.getAnalyticsSummary();
}

function getAnalyticsTrends() {
  return analyticsController_.getAnalyticsTrends();
}

if (typeof module !== 'undefined') {
  module.exports = {
    doGet,
    getAnalyticsSummary,
    getAnalyticsTrends,
    getWebAppUrl,
    logAnalyticsEvent,
  };
}
