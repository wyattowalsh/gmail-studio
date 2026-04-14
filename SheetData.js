/**
 * Helper to get values from a named range or sheet.
 */
function getNamedRangeValues_(rangeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const range = ss.getRangeByName(rangeName);
  if (!range) return null;
  return range.getValues();
}

function getSheetByNameOrThrow_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Missing sheet: ' + sheetName);
  }
  return sheet;
}

function getOutboundSheetSnapshot_() {
  const sheet = getSheetByNameOrThrow_(SHEET_NAMES.outbound);
  const lastRow = Math.max(sheet.getLastRow(), OUTBOUND_HEADER_ROW);
  const lastColumn = getOutboundHeaders().length;
  const values = sheet.getRange(OUTBOUND_HEADER_ROW, 1, lastRow - OUTBOUND_HEADER_ROW + 1, lastColumn).getValues();
  const headers = values[0].map((header) => String(header || '').trim());
  const config = getConfig();

  const rows = values.slice(1).map((row, index) => {
    const payload = {};
    headers.forEach((header, headerIndex) => {
      payload[header] = row[headerIndex];
    });

    payload.__rowNumber = OUTBOUND_HEADER_ROW + index + 1;
    return applyConfigDefaultsToPayload_(payload, config);
  });

  return {
    headers: headers,
    rows: rows,
    sheet: sheet,
  };
}

function applyConfigDefaultsToPayload_(payload, config) {
  const normalized = Object.assign({}, config, payload);
  const signatureData = typeof buildSignatureData === 'function' ? buildSignatureData(normalized) : {};
  normalized.template_name =
    typeof resolveTemplateDefinition === 'function'
      ? resolveTemplateDefinition(normalized.template_name || config.default_template).id
      : String(normalized.template_name || config.default_template || 'TemplatePersonalNote');
  if (!normalized.include_signature) {
    normalized.include_signature = config.signature_enabled || 'TRUE';
  }
  if (!normalized.delivery_mode) {
    normalized.delivery_mode = config.default_delivery_mode || 'SEND';
  }
  if (!normalized.signature_mode) {
    normalized.signature_mode = signatureData.signature_mode;
  }

  Object.keys(signatureData).forEach((key) => {
    if (!normalized[key]) {
      normalized[key] = signatureData[key];
    }
  });

  return normalized;
}

function appendOutboundRows(rows) {
  if (!rows || rows.length === 0) {
    return [];
  }

  const snapshot = getOutboundSheetSnapshot_();
  const sheet = snapshot.sheet;
  const headers = snapshot.headers;
  const startRow = Math.max(sheet.getLastRow() + 1, OUTBOUND_HEADER_ROW + 1);
  const values = rows.map((row) => headers.map((header) => (row[header] === undefined ? '' : row[header])));

  sheet.getRange(startRow, 1, values.length, headers.length).setValues(values);

  return values.map((_, index) => startRow + index);
}

/**
 * Reads key/value pairs from the Compose sheet.
 */
function getComposePayload() {
  const sheet = getSheetByNameOrThrow_(SHEET_NAMES.compose);

  const values = sheet.getDataRange().getValues();
  const payload = {};

  for (let i = 0; i < values.length; i += 1) {
    const key = String(values[i][0] || '').trim();
    const value = values[i][1];
    if (key) payload[key] = value;
  }

  // Merge with global Config
  const config = getConfig();
  return applyConfigDefaultsToPayload_(payload, config);
}

/**
 * Returns the selected row from Outbound as an object.
 */
function getSelectedOutboundPayload() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeRange = ss.getActiveRange();
  const row = activeRange.getRow();
  const snapshot = getOutboundSheetSnapshot_();

  if (row <= OUTBOUND_HEADER_ROW) {
    throw new Error('Select a data row in Outbound.');
  }

  const payload = snapshot.rows.find((candidate) => candidate.__rowNumber === row);
  if (!payload) {
    throw new Error('Select a data row in Outbound.');
  }

  return payload;
}

/**
 * Returns all unsent rows from Outbound.
 */
function getUnsentOutboundPayloads() {
  return getOutboundSheetSnapshot_().rows.filter((payload) => {
    const status = String(payload.status || '')
      .trim()
      .toUpperCase();
    return status !== 'SENT' && status !== 'DRAFTED';
  });
}

function getDispatchableOutboundPayloads(now, deliveryMode) {
  const referenceTime = now instanceof Date ? now : new Date();
  const targetMode = String(deliveryMode || '')
    .trim()
    .toUpperCase();

  return getOutboundSheetSnapshot_().rows.filter((payload) => {
    const status = String(payload.status || '')
      .trim()
      .toUpperCase();
    const mode = String(payload.delivery_mode || 'SEND')
      .trim()
      .toUpperCase();
    const scheduledAt = payload.scheduled_time ? new Date(payload.scheduled_time) : null;
    const isDue =
      !scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= referenceTime.getTime();

    if (targetMode && mode !== targetMode) {
      return false;
    }

    if (status === 'SENT' || status === 'DRAFTED' || status === 'ERROR' || status === 'DRY_RUN') {
      return false;
    }

    if (status === 'SCHEDULED') {
      return isDue;
    }

    if (status === 'PENDING' || status === '') {
      return isDue;
    }

    return false;
  });
}

/**
 * Marks a batch row as SENT or ERROR.
 */
function updateOutboundStatus(rowNumber, status, errorMessage) {
  const patch = {
    error: errorMessage || '',
    status: status,
  };

  if (status === 'SENT') {
    patch.sent_at = new Date();
  }

  if (status === 'DRAFTED') {
    patch.drafted_at = new Date();
  }

  updateOutboundRows([{ rowNumber: rowNumber, patch: patch }]);
}

function updateOutboundRows(updates) {
  if (!updates || updates.length === 0) {
    return;
  }

  const snapshot = getOutboundSheetSnapshot_();
  const sheet = snapshot.sheet;
  const headers = snapshot.headers;
  const minRow = Math.min.apply(
    null,
    updates.map((update) => update.rowNumber)
  );
  const maxRow = Math.max.apply(
    null,
    updates.map((update) => update.rowNumber)
  );
  const range = sheet.getRange(minRow, 1, maxRow - minRow + 1, headers.length);
  const values = range.getValues();

  updates.forEach((update) => {
    const rowOffset = update.rowNumber - minRow;
    Object.keys(update.patch).forEach((key) => {
      const columnIndex = headers.indexOf(key);
      if (columnIndex === -1) {
        return;
      }
      values[rowOffset][columnIndex] = update.patch[key];
    });
  });

  range.setValues(values);
}

/**
 * Gets global config from the Config sheet.
 */
function getConfig() {
  const defaults = getConfigDefaults();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.config);
  if (!sheet) {
    return defaults;
  }

  const values = sheet.getDataRange().getValues();
  const config = Object.assign({}, defaults);
  values.slice(1).forEach((row) => {
    const key = String(row[0] || '').trim();
    if (!key) {
      return;
    }
    config[key] = row[1];
  });

  return config;
}

if (typeof module !== 'undefined') {
  module.exports = {
    appendOutboundRows,
    applyConfigDefaultsToPayload_,
    getDispatchableOutboundPayloads,
    getComposePayload,
    getOutboundSheetSnapshot_,
    getSelectedOutboundPayload,
    getUnsentOutboundPayloads,
    getConfig,
    updateOutboundRows,
    updateOutboundStatus,
  };
}
