function getAnalyticsController_() {
  if (typeof require === 'function') {
    return require('../controllers/AnalyticsController');
  }

  return {
    doGet: typeof doGet_ === 'function' ? doGet_ : null,
    getAnalyticsSummary: typeof getAnalyticsSummary_ === 'function' ? getAnalyticsSummary_ : null,
    getAnalyticsTrends: typeof getAnalyticsTrends_ === 'function' ? getAnalyticsTrends_ : null,
    getWebAppUrl: typeof getWebAppUrl_ === 'function' ? getWebAppUrl_ : null,
    logAnalyticsEvent: typeof logAnalyticsEvent_ === 'function' ? logAnalyticsEvent_ : null,
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
