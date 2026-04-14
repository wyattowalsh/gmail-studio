function onOpen_() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Email Tools');

  const sections = [
    {
      legacyItems: [
        ['Initialize / Reset Sheets (Destructive)', 'setupSheets'],
        ['Restyle Workbook', 'restyleWorkbook'],
        ['Refresh Start Here', 'refreshStartHereSheet'],
        ['Refresh Operator Safeguards', 'refreshOperatorSafeguards'],
        ['Refresh Queue Views', 'refreshQueueViews'],
      ],
      items: [
        ['Rebuild Workbook (Destructive)', 'setupSheets'],
        ['Restyle Workbook', 'restyleWorkbook'],
        ['Refresh Start Here', 'refreshStartHereSheet'],
        ['Refresh Operator Safeguards', 'refreshOperatorSafeguards'],
        ['Refresh Queue Views', 'refreshQueueViews'],
      ],
      label: 'Workbook',
    },
    {
      legacyItems: [['Open Dashboard', 'openSidebar']],
      items: [['Open Studio Sidebar', 'openSidebar']],
      label: 'Sidebar',
    },
    {
      legacyItems: [
        ['Preview compose draft', 'previewComposeDraft'],
        ['Create compose draft in Gmail', 'createComposeDraft'],
        ['Send test draft to myself', 'sendTestComposeDraft'],
        ['Send compose draft', 'sendComposeDraft'],
      ],
      items: [
        ['Preview compose draft', 'previewComposeDraft'],
        ['Create Gmail draft', 'createComposeDraft'],
        ['Send test draft to myself', 'sendTestComposeDraft'],
        ['Send compose draft', 'sendComposeDraft'],
      ],
      label: 'Compose',
    },
    {
      legacyItems: [
        ['Preview selected outbound row', 'previewSelectedOutboundRow'],
        ['Create selected outbound draft', 'createSelectedOutboundDraft'],
        ['Send selected outbound row', 'sendSelectedOutboundRow'],
        ['Send unsent batch', 'sendUnsentBatch'],
        ['Create scheduled drafts', 'createScheduledDraftBatch'],
      ],
      items: [
        ['Preview selected outbound row', 'previewSelectedOutboundRow'],
        ['Create selected outbound draft', 'createSelectedOutboundDraft'],
        ['Send selected outbound row', 'sendSelectedOutboundRow'],
        ['Send unsent batch', 'sendUnsentBatch'],
        ['Create scheduled drafts', 'createScheduledDraftBatch'],
      ],
      label: 'Outbound',
    },
    {
      legacyItems: [
        ['Start scheduler (hourly)', 'startScheduler'],
        ['Stop scheduler', 'stopScheduler'],
      ],
      items: [
        ['Start scheduler (hourly)', 'startScheduler'],
        ['Stop scheduler', 'stopScheduler'],
      ],
      label: 'Automation',
    },
  ];

  if (typeof menu.addSubMenu === 'function') {
    sections.forEach((section) => {
      const subMenu = ui.createMenu(section.label);
      section.items.forEach(([label, handler]) => subMenu.addItem(label, handler));
      menu.addSubMenu(subMenu);
    });
  } else {
    sections.forEach((section, index) => {
      if (index > 0) {
        menu.addSeparator();
      }
      section.legacyItems.forEach(([label, handler]) => menu.addItem(label, handler));
    });
  }

  menu.addToUi();
}

function openSidebar_() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Gmail Studio Control');
  SpreadsheetApp.getUi().showSidebar(html);
}

function startScheduler_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendScheduledBatch') {
      SpreadsheetApp.getUi().alert('The hourly scheduler is already running.');
      return;
    }
  }

  ScriptApp.newTrigger('sendScheduledBatch').timeBased().everyHours(1).create();

  SpreadsheetApp.getUi().alert('Hourly scheduler started. Gmail Studio will check for scheduled sends every hour.');
}

function stopScheduler_() {
  const triggers = ScriptApp.getProjectTriggers();
  let stopped = false;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendScheduledBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
      stopped = true;
    }
  }

  if (stopped) {
    SpreadsheetApp.getUi().alert('Hourly scheduler stopped.');
  } else {
    SpreadsheetApp.getUi().alert('The hourly scheduler was not running.');
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    onOpen: onOpen_,
    openSidebar: openSidebar_,
    startScheduler: startScheduler_,
    stopScheduler: stopScheduler_,
  };
}
