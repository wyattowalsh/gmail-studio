const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadMenuModule(sandbox) {
  const filePath = path.join(__dirname, '..', 'Menu.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };

  vm.runInNewContext(`${source}\nmodule.exports = { onOpen, openSidebar, startScheduler, stopScheduler };`, {
    module: module,
    exports: module.exports,
    ...sandbox,
  });

  return module.exports;
}

describe('Menu', () => {
  test('onOpen registers the workbook redesign actions', () => {
    const entries = [];
    const menu = {
      addItem(label, handler) {
        entries.push({ handler: handler, label: label, type: 'item' });
        return this;
      },
      addSeparator() {
        entries.push({ type: 'separator' });
        return this;
      },
      addToUi() {
        return this;
      },
    };

    const ui = {
      createMenu: jest.fn().mockReturnValue(menu),
    };

    const menuModule = loadMenuModule({
      HtmlService: {
        createHtmlOutputFromFile: jest.fn().mockReturnValue({
          setTitle: jest.fn().mockReturnThis(),
        }),
      },
      ScriptApp: {
        getProjectTriggers: jest.fn().mockReturnValue([]),
      },
      SpreadsheetApp: {
        getUi: jest.fn().mockReturnValue(ui),
      },
    });

    menuModule.onOpen();

    expect(ui.createMenu).toHaveBeenCalledWith('Email Tools');
    expect(entries).toEqual(
      expect.arrayContaining([
        { handler: 'setupSheets', label: 'Initialize / Reset Sheets (Destructive)', type: 'item' },
        { handler: 'restyleWorkbook', label: 'Restyle Workbook', type: 'item' },
        { handler: 'refreshStartHereSheet', label: 'Refresh Start Here', type: 'item' },
      ])
    );
  });
});
