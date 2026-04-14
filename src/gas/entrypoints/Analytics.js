function getAnalyticsController_() {
  if (typeof require === 'function') {
    return require('../controllers/AnalyticsController');
  }

  return {
    doGet: typeof globalThis.doGet_ === 'function' ? globalThis.doGet_ : null,
    getAnalyticsSummary: typeof globalThis.getAnalyticsSummary_ === 'function' ? globalThis.getAnalyticsSummary_ : null,
    getAnalyticsTrends: typeof globalThis.getAnalyticsTrends_ === 'function' ? globalThis.getAnalyticsTrends_ : null,
    getWebAppUrl: typeof globalThis.getWebAppUrl_ === 'function' ? globalThis.getWebAppUrl_ : null,
    logAnalyticsEvent: typeof globalThis.logAnalyticsEvent_ === 'function' ? globalThis.logAnalyticsEvent_ : null,
  };
}

function invokeAnalyticsController_(methodName, args) {
  const handler = getAnalyticsController_()[methodName];
  if (typeof handler !== 'function') {
    throw new Error(`Analytics controller method "${methodName}" is unavailable.`);
  }

  return handler.apply(null, args || []);
}

function doGet(e) {
  return invokeAnalyticsController_('doGet', [e]);
}

function logAnalyticsEvent(email, eventType, detail) {
  return invokeAnalyticsController_('logAnalyticsEvent', [email, eventType, detail]);
}

function getWebAppUrl() {
  return invokeAnalyticsController_('getWebAppUrl');
}

function getAnalyticsSummary() {
  return invokeAnalyticsController_('getAnalyticsSummary');
}

function getAnalyticsTrends() {
  return invokeAnalyticsController_('getAnalyticsTrends');
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
