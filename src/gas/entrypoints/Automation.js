const automationController_ =
  typeof require === 'function' ? require('../controllers/AutomationController') : globalThis || {};

function onEdit(e) {
  return automationController_.onEdit(e);
}

if (typeof module !== 'undefined') {
  module.exports = {
    onEdit,
  };
}
