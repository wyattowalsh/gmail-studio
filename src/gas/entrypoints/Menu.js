function getMenuController_() {
  if (typeof require === 'function') {
    return require('../controllers/MenuController');
  }

  return {
    onOpen: typeof globalThis.onOpen_ === 'function' ? globalThis.onOpen_ : null,
    openSidebar: typeof globalThis.openSidebar_ === 'function' ? globalThis.openSidebar_ : null,
    startScheduler: typeof globalThis.startScheduler_ === 'function' ? globalThis.startScheduler_ : null,
    stopScheduler: typeof globalThis.stopScheduler_ === 'function' ? globalThis.stopScheduler_ : null,
  };
}

function invokeMenuController_(methodName, args) {
  const handler = getMenuController_()[methodName];
  if (typeof handler !== 'function') {
    throw new Error(`Menu controller method "${methodName}" is unavailable.`);
  }

  return handler.apply(null, args || []);
}

function onOpen() {
  return invokeMenuController_('onOpen');
}

function openSidebar() {
  return invokeMenuController_('openSidebar');
}

function startScheduler() {
  return invokeMenuController_('startScheduler');
}

function stopScheduler() {
  return invokeMenuController_('stopScheduler');
}

if (typeof module !== 'undefined') {
  module.exports = {
    onOpen,
    openSidebar,
    startScheduler,
    stopScheduler,
  };
}
