const menuController_ = typeof require === 'function' ? require('../controllers/MenuController') : globalThis || {};

function onOpen() {
  return menuController_.onOpen();
}

function openSidebar() {
  return menuController_.openSidebar();
}

function startScheduler() {
  return menuController_.startScheduler();
}

function stopScheduler() {
  return menuController_.stopScheduler();
}

if (typeof module !== 'undefined') {
  module.exports = {
    onOpen,
    openSidebar,
    startScheduler,
    stopScheduler,
  };
}
