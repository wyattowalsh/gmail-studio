/**
 * Initializes the workbook structure and then applies the shared presentation layer.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const configDefaults = getConfigDefaults();
  const templateNames = getSelectableTemplateNames();
  const deliveryModes = getDeliveryModes();
  const outboundHeaders = getOutboundHeaders();
  const outboundStatuses = getOutboundStatuses();
  const signatureModes = getSignatureModes();

  resetConfigSheet_(ss, configDefaults);
  resetComposeSheet_(ss, configDefaults, templateNames, deliveryModes, signatureModes);
  resetOutboundSheet_(ss, outboundHeaders, outboundStatuses, templateNames, deliveryModes, signatureModes);
  resetAnalyticsSheet_(ss);

  const oldTemplates = ss.getSheetByName('Templates');
  if (oldTemplates) {
    ss.deleteSheet(oldTemplates);
  }

  applyWorkbookPresentation_(ss, { rebuildStartHere: true });
  ui.alert('Gmail Studio // workbook reset and redesigned.');
}

function restyleWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  applyWorkbookPresentation_(ss, { rebuildStartHere: true });
  SpreadsheetApp.getUi().alert('Workbook restyled. Data and queue state were preserved.');
}

function refreshStartHereSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  refreshStartHereSheet_(ss);
  applyWorkbookPresentation_(ss, { rebuildStartHere: false });
  SpreadsheetApp.getUi().alert('Start Here refreshed.');
}

function resetConfigSheet_(spreadsheet, configDefaults) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEET_NAMES.config) || ss.insertSheet(SHEET_NAMES.config);
  const configData = [
    ['Setting', 'Value', 'Description'],
    ['sender_name', configDefaults.sender_name, 'The name that appears in the From field'],
    ['reply_to', configDefaults.reply_to, 'The email address for replies'],
    ['default_template', configDefaults.default_template, 'Default template name'],
    ['signature_enabled', configDefaults.signature_enabled, 'Include signature by default'],
    ['signature_mode', configDefaults.signature_mode, 'Default signature style: compact or full'],
    ['signature_name', configDefaults.signature_name, 'Display name used in the email signature'],
    ['signature_email', configDefaults.signature_email, 'Primary contact email shown in the signature'],
    ['signature_website_label', configDefaults.signature_website_label, 'Label for the website link in the signature'],
    ['signature_website_href', configDefaults.signature_website_href, 'Website link used in the signature'],
    [
      'signature_linkedin_label',
      configDefaults.signature_linkedin_label,
      'Label for the LinkedIn link in the signature',
    ],
    ['signature_linkedin_href', configDefaults.signature_linkedin_href, 'LinkedIn link used in the signature'],
    ['signature_github_label', configDefaults.signature_github_label, 'Label for the GitHub link in the signature'],
    ['signature_github_href', configDefaults.signature_github_href, 'GitHub link used in the signature'],
    ['signature_note', configDefaults.signature_note, 'Optional note shown in the full signature mode'],
    ['tracking_enabled', configDefaults.tracking_enabled, 'Enable open and click tracking in sent emails'],
    [
      'default_delivery_mode',
      configDefaults.default_delivery_mode,
      'Whether compose actions send or create drafts by default',
    ],
    [
      'from_alias',
      configDefaults.from_alias,
      'Optional Gmail alias to use when creating drafts or sending as an alias',
    ],
    ['batch_max_size', configDefaults.batch_max_size, 'Maximum rows to process in a single batch execution'],
    ['batch_headroom', configDefaults.batch_headroom, 'Recipients of daily quota to reserve for manual sends'],
  ];

  configSheet.clear();
  configSheet.getRange(1, 1, configData.length, 3).setValues(configData);
  ss.setNamedRange('ConfigValues', configSheet.getRange(2, 1, configData.length - 1, 2));
}

function resetComposeSheet_(spreadsheet, configDefaults, templateNames, deliveryModes, signatureModes) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const composeSheet = ss.getSheetByName(SHEET_NAMES.compose) || ss.insertSheet(SHEET_NAMES.compose);
  const composeData = [
    ['field', 'value'],
    ['recipient', 'homie@example.com'],
    ['subject', 'quick note from me'],
    ['headline', 'made this for the homies'],
    ['preview_text', 'quick note from me'],
    ['first_name', 'Alex'],
    [
      'body_text',
      'yo,\n\ni finally put together a cleaner way to send nice-looking emails straight from sheets.\n\nthis one is just a test, but the vibe is:\n- personal\n- simple\n- actually readable\n- not some ugly default gmail block\n\nif this lands cleanly, mission accomplished.\n\n- me',
    ],
    ['cta_text', 'Open it'],
    ['cta_url', 'https://example.com'],
    ['template_name', configDefaults.default_template],
    ['include_signature', configDefaults.signature_enabled],
    ['signature_mode', configDefaults.signature_mode],
    ['delivery_mode', configDefaults.default_delivery_mode],
    ['from_alias', configDefaults.from_alias],
    ['reply_to', configDefaults.reply_to],
    ['footer_note', 'sent with care, not automation sludge.'],
    ['footer_company', 'Homies Inc.'],
    ['footer_address', 'Los Angeles, CA'],
    ['attachment_ids', ''],
  ];

  composeSheet.clear();
  composeSheet.getRange(1, 1, composeData.length, 2).setValues(composeData);

  const templateRule = buildListValidation_(templateNames);
  const deliveryModeRule = buildListValidation_(deliveryModes);
  const signatureModeRule = buildListValidation_(signatureModes);
  const composeValues = composeSheet.getRange(2, 1, composeData.length - 1, 2).getValues();

  composeValues.forEach((row, index) => {
    const label = row[0];
    const rowNumber = index + 2;
    if (label === 'template_name') {
      composeSheet.getRange(rowNumber, 2).setDataValidation(templateRule);
    }
    if (label === 'delivery_mode') {
      composeSheet.getRange(rowNumber, 2).setDataValidation(deliveryModeRule);
    }
    if (label === 'signature_mode') {
      composeSheet.getRange(rowNumber, 2).setDataValidation(signatureModeRule);
    }
  });
}

function resetOutboundSheet_(
  spreadsheet,
  outboundHeaders,
  outboundStatuses,
  templateNames,
  deliveryModes,
  signatureModes
) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const outboundSheet = ss.getSheetByName(SHEET_NAMES.outbound) || ss.insertSheet(SHEET_NAMES.outbound);
  const templateRule = buildListValidation_(templateNames);
  const deliveryModeRule = buildListValidation_(deliveryModes);
  const signatureModeRule = buildListValidation_(signatureModes);
  const statusRule = buildListValidation_(outboundStatuses);

  outboundSheet.clear();
  outboundSheet
    .getRange('A1')
    .setFormula(
      '= "QUEUE STATUS / " & IF(GET_REMAINING_QUOTA() > VALUE(IFERROR(VLOOKUP("batch_headroom",Config!A:B,2,FALSE),0)), "READY", "LOW HEADROOM") & " / REMAINING " & GET_REMAINING_QUOTA()'
    );
  outboundSheet.getRange(2, 1, 1, outboundHeaders.length).setValues([outboundHeaders]);

  const statusCol = outboundHeaders.indexOf('status') + 1;
  const templateCol = outboundHeaders.indexOf('template_name') + 1;
  const deliveryModeCol = outboundHeaders.indexOf('delivery_mode') + 1;
  const signatureModeCol = outboundHeaders.indexOf('signature_mode') + 1;

  outboundSheet.getRange(3, statusCol, 998, 1).setDataValidation(statusRule);
  outboundSheet.getRange(3, templateCol, 998, 1).setDataValidation(templateRule);
  outboundSheet.getRange(3, deliveryModeCol, 998, 1).setDataValidation(deliveryModeRule);
  outboundSheet.getRange(3, signatureModeCol, 998, 1).setDataValidation(signatureModeRule);
}

function resetAnalyticsSheet_(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const analyticsSheet = ss.getSheetByName(SHEET_NAMES.analytics) || ss.insertSheet(SHEET_NAMES.analytics);
  const analyticsHeaders = getAnalyticsHeaders();

  analyticsSheet.clear();
  analyticsSheet.getRange(1, 1, 1, analyticsHeaders.length).setValues([analyticsHeaders]);
}

function buildListValidation_(values) {
  return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildListValidation_,
    refreshStartHereSheet,
    resetAnalyticsSheet_,
    resetComposeSheet_,
    resetConfigSheet_,
    resetOutboundSheet_,
    restyleWorkbook,
    setupSheets,
  };
}
