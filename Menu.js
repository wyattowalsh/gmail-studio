function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Email Tools')
    .addItem('Initialize / Reset Sheets (Destructive)', 'setupSheets')
    .addItem('Restyle Workbook', 'restyleWorkbook')
    .addItem('Refresh Start Here', 'refreshStartHereSheet')
    .addSeparator()
    .addItem('Open Dashboard', 'openSidebar')
    .addSeparator()
    .addItem('Preview compose draft', 'previewComposeDraft')
    .addItem('Create compose draft in Gmail', 'createComposeDraft')
    .addItem('Send test draft to myself', 'sendTestComposeDraft')
    .addItem('Send compose draft', 'sendComposeDraft')
    .addSeparator()
    .addItem('Preview selected outbound row', 'previewSelectedOutboundRow')
    .addItem('Create selected outbound draft', 'createSelectedOutboundDraft')
    .addItem('Send selected outbound row', 'sendSelectedOutboundRow')
    .addItem('Send unsent batch', 'sendUnsentBatch')
    .addItem('Create scheduled drafts', 'createScheduledDraftBatch')
    .addSeparator()
    .addItem('Start scheduler (hourly)', 'startScheduler')
    .addItem('Stop scheduler', 'stopScheduler')
    .addToUi();
}

function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Gmail Studio Dashboard');
  SpreadsheetApp.getUi().showSidebar(html);
}

function startScheduler() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendScheduledBatch') {
      SpreadsheetApp.getUi().alert('Scheduler is already running.');
      return;
    }
  }

  ScriptApp.newTrigger('sendScheduledBatch').timeBased().everyHours(1).create();

  SpreadsheetApp.getUi().alert('Scheduler started. It will check for scheduled emails every hour.');
}

function stopScheduler() {
  const triggers = ScriptApp.getProjectTriggers();
  let stopped = false;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendScheduledBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
      stopped = true;
    }
  }

  if (stopped) {
    SpreadsheetApp.getUi().alert('Scheduler stopped.');
  } else {
    SpreadsheetApp.getUi().alert('Scheduler was not running.');
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    openSidebar,
    onOpen,
    startScheduler,
    stopScheduler,
  };
}
