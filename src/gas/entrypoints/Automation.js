function getAutomationController_() {
  if (typeof require === 'function') {
    return require('../controllers/AutomationController');
  }

  return {
    onEdit: typeof onEdit_ === 'function' ? onEdit_ : null,
  };
}

function invokeAutomationController_(methodName, args) {
  const handler = getAutomationController_()[methodName];
  if (typeof handler !== 'function') {
    throw new Error(`Automation controller method "${methodName}" is unavailable.`);
  }

  return handler.apply(null, args || []);
}

function onEdit(e) {
  return invokeAutomationController_('onEdit', [e]);
}

if (typeof module !== 'undefined') {
  module.exports = {
    onEdit,
  };
}
