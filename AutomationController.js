/**
 * Handles sheet edits for automation.
 */
function onEdit_(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const value = e.value;
  const header = String(sheet.getRange(1, range.getColumn()).getValue() || '')
    .trim()
    .toLowerCase();

  // Automation: When a row in any sheet has a 'READY' status in a column named 'studio_status'
  // It copies that row to the Outbound sheet.
  if (
    header === 'studio_status' &&
    value === 'READY' &&
    sheetName !== SHEET_NAMES.outbound &&
    sheetName !== SHEET_NAMES.analytics
  ) {
    try {
      handleReadyRow_(sheet, range.getRow());
    } catch (e) {
      console.error('Automation Error:', e.message);
    }
  }
}

/**
 * Copies a row to the Outbound queue.
 */
function handleReadyRow_(sourceSheet, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const snapshot = getOutboundSheetSnapshot_();

  const sourceHeaders = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
  const sourceData = sourceSheet.getRange(row, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
  const outboundHeaders = snapshot.headers;

  const existingRow = snapshot.rows.find((candidate) => {
    return String(candidate.source_sheet || '') === sourceSheet.getName() && Number(candidate.source_row || 0) === row;
  });

  if (existingRow) {
    ss.toast('Row already queued in Outbound.', 'Gmail Studio');
    return existingRow.__rowNumber;
  }

  const newRow = new Array(outboundHeaders.length).fill('');

  // Map source columns to outbound columns by header name
  outboundHeaders.forEach((header, idx) => {
    const sIdx = sourceHeaders.indexOf(header);
    if (sIdx !== -1) {
      newRow[idx] = sourceData[sIdx];
    }
  });

  // Set default status to PENDING
  const statusIdx = outboundHeaders.indexOf('status');
  if (statusIdx !== -1) newRow[statusIdx] = 'PENDING';
  const deliveryModeIdx = outboundHeaders.indexOf('delivery_mode');
  if (deliveryModeIdx !== -1 && !newRow[deliveryModeIdx]) newRow[deliveryModeIdx] = 'SEND';
  const templateIdx = outboundHeaders.indexOf('template_name');
  if (templateIdx !== -1 && !newRow[templateIdx])
    newRow[templateIdx] = getConfig().default_template || 'TemplateBrutalist';
  const sourceSheetIdx = outboundHeaders.indexOf('source_sheet');
  if (sourceSheetIdx !== -1) newRow[sourceSheetIdx] = sourceSheet.getName();
  const sourceRowIdx = outboundHeaders.indexOf('source_row');
  if (sourceRowIdx !== -1) newRow[sourceRowIdx] = row;

  appendOutboundRows([
    outboundHeaders.reduce((payload, header, index) => {
      payload[header] = newRow[index];
      return payload;
    }, {}),
  ]);
  ss.toast('Row queued to Outbound!', 'Gmail Studio');

  // Mark source row as QUEUED
  const studioStatusIdx = sourceHeaders.indexOf('studio_status');
  if (studioStatusIdx !== -1) {
    sourceSheet.getRange(row, studioStatusIdx + 1).setValue('QUEUED');
  }
}

/**
 * Shows a toast notification.
 */
function notifyUser(message, title = 'Gmail Studio') {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title);
}

if (typeof module !== 'undefined') {
  module.exports = {
    handleReadyRow_,
    notifyUser,
    onEdit: onEdit_,
  };
}
