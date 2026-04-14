const path = require('node:path');

const menuControllerPath = path.resolve(process.cwd(), 'src/gas/controllers/MenuController.js');

function loadMenuModule(sandbox) {
  jest.resetModules();
  Object.assign(global, sandbox);
  return require(menuControllerPath);
}

describe('Menu', () => {
  function createMenuRecord(label) {
    return {
      items: [],
      label: label,
      subMenus: [],
      addItem(label, handler) {
        this.items.push({ handler: handler, label: label, type: 'item' });
        return this;
      },
      addSeparator() {
        this.items.push({ type: 'separator' });
        return this;
      },
      addSubMenu(subMenu) {
        this.subMenus.push(subMenu);
        return this;
      },
      addToUi() {
        return this;
      },
    };
  }

  test('onOpen groups actions into workbook, sidebar, compose, outbound, and automation menus', () => {
    const menus = [];
    const ui = {
      createMenu: jest.fn((label) => {
        const menu = createMenuRecord(label);
        menus.push(menu);
        return menu;
      }),
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

    const mainMenu = menus[0];
    const workbookMenu = mainMenu.subMenus.find((menu) => menu.label === 'Workbook');
    const sidebarMenu = mainMenu.subMenus.find((menu) => menu.label === 'Sidebar');

    expect(ui.createMenu).toHaveBeenCalledWith('Email Tools');
    expect(mainMenu.subMenus.map((menu) => menu.label)).toEqual([
      'Workbook',
      'Sidebar',
      'Compose',
      'Outbound',
      'Automation',
    ]);
    expect(workbookMenu.items).toEqual(
      expect.arrayContaining([
        { handler: 'setupSheets', label: 'Rebuild Workbook (Destructive)', type: 'item' },
        { handler: 'refreshOperatorSafeguards', label: 'Refresh Operator Safeguards', type: 'item' },
        { handler: 'refreshQueueViews', label: 'Refresh Queue Views', type: 'item' },
      ])
    );
    expect(sidebarMenu.items).toEqual([{ handler: 'openSidebar', label: 'Open Studio Sidebar', type: 'item' }]);
  });

  test('openSidebar uses the warm-premium title', () => {
    const showSidebar = jest.fn();
    const setTitle = jest.fn().mockReturnThis();

    const ui = {
      showSidebar: showSidebar,
    };

    const menuModule = loadMenuModule({
      HtmlService: {
        createHtmlOutputFromFile: jest.fn().mockReturnValue({
          setTitle: setTitle,
        }),
      },
      ScriptApp: {
        getProjectTriggers: jest.fn().mockReturnValue([]),
      },
      SpreadsheetApp: {
        getUi: jest.fn().mockReturnValue(ui),
      },
    });

    menuModule.openSidebar();

    expect(setTitle).toHaveBeenCalledWith('Gmail Studio Control');
    expect(showSidebar).toHaveBeenCalled();
  });
});
