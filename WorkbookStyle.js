const WORKBOOK_THEME = Object.freeze({
  accent: '#6f897d',
  accentSoft: '#dfe8e2',
  analyticsPanel: '#e6edf2',
  bodyFont: 'Arial',
  editableBackground: '#fffdf8',
  editableBorder: '#c9d4ce',
  headerBackground: '#5c7265',
  headerText: '#fffaf2',
  ink: '#1f221c',
  line: '#d7cec2',
  muted: '#5e655d',
  queuePanel: '#e8eee8',
  riskPanel: '#f4e4db',
  softGold: '#f1e8da',
  surface: '#fcf8f1',
  surfaceAlt: '#f6f0e6',
  tabColors: Object.freeze({
    analytics: '#7a93a6',
    compose: '#a16e57',
    config: '#8f8778',
    outbound: '#6f897d',
    start: '#6f897d',
  }),
});

const OUTBOUND_DEFAULT_VISIBLE_HEADERS = Object.freeze([
  'recipient',
  'first_name',
  'company',
  'subject',
  'headline',
  'body_text',
  'preview_text',
  'cta_text',
  'cta_url',
  'template_name',
  'delivery_mode',
  'scheduled_time',
  'attachment_ids',
  'status',
  'sent_at',
  'error',
]);

const OUTBOUND_ADVANCED_HEADERS = Object.freeze([
  'subject_a',
  'subject_b',
  'headline_a',
  'headline_b',
  'body_html',
  'include_signature',
  'sender_name',
  'reply_to',
  'from_alias',
  'signature_mode',
  'signature_name',
  'signature_email',
  'signature_website_label',
  'signature_website_href',
  'signature_linkedin_label',
  'signature_linkedin_href',
  'signature_github_label',
  'signature_github_href',
  'signature_note',
  'footer_note',
  'footer_company',
  'footer_address',
  'source_sheet',
  'source_row',
  'sequence_id',
  'step_number',
  'subject_variant',
  'headline_variant',
  'draft_id',
  'drafted_at',
  'last_attempt_at',
]);

const START_SHEET_CANDIDATE_PATTERN = /\b(start here|welcome|overview|home|template|import|email studio)\b/i;

function getWorkbookTheme() {
  return {
    accent: WORKBOOK_THEME.accent,
    accentSoft: WORKBOOK_THEME.accentSoft,
    analyticsPanel: WORKBOOK_THEME.analyticsPanel,
    bodyFont: WORKBOOK_THEME.bodyFont,
    editableBackground: WORKBOOK_THEME.editableBackground,
    editableBorder: WORKBOOK_THEME.editableBorder,
    headerBackground: WORKBOOK_THEME.headerBackground,
    headerText: WORKBOOK_THEME.headerText,
    ink: WORKBOOK_THEME.ink,
    line: WORKBOOK_THEME.line,
    muted: WORKBOOK_THEME.muted,
    queuePanel: WORKBOOK_THEME.queuePanel,
    riskPanel: WORKBOOK_THEME.riskPanel,
    softGold: WORKBOOK_THEME.softGold,
    surface: WORKBOOK_THEME.surface,
    surfaceAlt: WORKBOOK_THEME.surfaceAlt,
    tabColors: Object.assign({}, WORKBOOK_THEME.tabColors),
  };
}

function getDefaultVisibleOutboundHeaders() {
  return OUTBOUND_DEFAULT_VISIBLE_HEADERS.slice();
}

function getAdvancedOutboundHeaders() {
  return OUTBOUND_ADVANCED_HEADERS.slice();
}

function getPreferredSheetOrder() {
  return [SHEET_NAMES.start, SHEET_NAMES.compose, SHEET_NAMES.outbound, SHEET_NAMES.config, SHEET_NAMES.analytics];
}

function findStartHereCandidateName(sheetNames) {
  const names = (sheetNames || []).slice();
  const coreNames = Object.keys(SHEET_NAMES).map((key) => SHEET_NAMES[key]);

  if (names.indexOf(SHEET_NAMES.start) !== -1) {
    return SHEET_NAMES.start;
  }

  return (
    names.find(
      (name) => coreNames.indexOf(name) === -1 && START_SHEET_CANDIDATE_PATTERN.test(String(name || '').trim())
    ) || ''
  );
}

function applyWorkbookPresentation_(spreadsheet, options) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const config = options || {};
  const startSheet =
    config.rebuildStartHere === false ? ss.getSheetByName(SHEET_NAMES.start) : refreshStartHereSheet_(ss);

  const composeSheet = ss.getSheetByName(SHEET_NAMES.compose);
  const outboundSheet = ss.getSheetByName(SHEET_NAMES.outbound);
  const configSheet = ss.getSheetByName(SHEET_NAMES.config);
  const analyticsSheet = ss.getSheetByName(SHEET_NAMES.analytics);

  if (composeSheet) {
    applyComposeSheetTheme_(composeSheet);
  }
  if (outboundSheet) {
    applyOutboundSheetTheme_(outboundSheet);
  }
  if (configSheet) {
    applyConfigSheetTheme_(configSheet);
  }
  if (analyticsSheet) {
    applyAnalyticsSheetTheme_(analyticsSheet);
  }
  if (startSheet) {
    styleStartHereTab_(startSheet);
  }

  reorderSheets_(ss, getPreferredSheetOrder());
}

function refreshStartHereSheet_(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureStartHereSheet_(ss);
  const url = typeof ss.getUrl === 'function' ? ss.getUrl() : '';
  const composeSheet = ss.getSheetByName(SHEET_NAMES.compose);
  const outboundSheet = ss.getSheetByName(SHEET_NAMES.outbound);
  const configSheet = ss.getSheetByName(SHEET_NAMES.config);
  const analyticsSheet = ss.getSheetByName(SHEET_NAMES.analytics);
  const theme = getWorkbookTheme();

  breakApartUsedRange_(sheet);
  sheet.clear();
  if (typeof sheet.clearNotes === 'function') {
    sheet.clearNotes();
  }
  if (typeof sheet.setConditionalFormatRules === 'function') {
    sheet.setConditionalFormatRules([]);
  }

  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  if (typeof sheet.showColumns === 'function') {
    sheet.showColumns(1, Math.max(sheet.getMaxColumns ? sheet.getMaxColumns() : 8, 8));
  }

  [
    [1, 28],
    [2, 160],
    [3, 160],
    [4, 160],
    [5, 160],
    [6, 160],
    [7, 160],
    [8, 28],
  ].forEach(([column, width]) => {
    sheet.setColumnWidth(column, width);
  });

  setRowHeightsIfPossible_(sheet, 1, 30, 18);
  [2, 3, 5, 10, 14, 18, 25].forEach((row) => sheet.setRowHeight(row, 28));

  mergeRange_(sheet.getRange('B2:G2')).setValue('Gmail Studio');
  sheet
    .getRange('B2:G2')
    .setBackground(theme.surface)
    .setFontFamily(theme.bodyFont)
    .setFontSize(22)
    .setFontWeight('bold')
    .setFontColor(theme.ink)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle')
    .setBorder(true, true, false, true, false, false, theme.line);

  mergeRange_(sheet.getRange('B3:G4')).setValue(
    'A calmer control plane for drafts, queue sends, and analytics. Configure defaults once, test in Compose, then run the queue when it is ready.'
  );
  sheet
    .getRange('B3:G4')
    .setBackground(theme.surface)
    .setFontFamily(theme.bodyFont)
    .setFontSize(11)
    .setFontColor(theme.muted)
    .setWrap(true)
    .setVerticalAlignment('top')
    .setBorder(false, true, true, true, false, false, theme.line);

  const steps = [
    {
      range: 'B6:C8',
      eyebrow: '1 / Configure',
      body: 'Set sender defaults, template, delivery mode, and signature settings in Config.',
      fill: theme.softGold,
    },
    {
      range: 'D6:E8',
      eyebrow: '2 / Draft + Test',
      body: 'Use Compose for one-off previews, drafts, and safe test sends before going live.',
      fill: theme.accentSoft,
    },
    {
      range: 'F6:G8',
      eyebrow: '3 / Queue + Send',
      body: 'Use Outbound for scheduled or batch sending with calmer defaults and status visibility.',
      fill: theme.queuePanel,
    },
  ];

  steps.forEach((step) => {
    mergeRange_(sheet.getRange(step.range)).setValue(`${step.eyebrow}\n\n${step.body}`);
    sheet
      .getRange(step.range)
      .setBackground(step.fill)
      .setFontFamily(theme.bodyFont)
      .setFontColor(theme.ink)
      .setFontSize(10)
      .setFontWeight('bold')
      .setWrap(true)
      .setVerticalAlignment('top')
      .setBorder(true, true, true, true, false, false, theme.line);
  });

  const cards = [
    {
      descriptionRange: 'B11:D12',
      label: 'Open Compose',
      titleRange: 'B10:D10',
      url: buildSheetUrl_(url, composeSheet),
      copy: 'Draft a one-to-one message, preview the HTML, and send a safe test.',
    },
    {
      descriptionRange: 'E11:G12',
      label: 'Open Outbound',
      titleRange: 'E10:G10',
      url: buildSheetUrl_(url, outboundSheet),
      copy: 'Review the queue, schedule rows, and watch send status without the noise.',
    },
    {
      descriptionRange: 'B15:D16',
      label: 'Open Config',
      titleRange: 'B14:D14',
      url: buildSheetUrl_(url, configSheet),
      copy: 'Adjust sender defaults, template choices, tracking, and batch headroom.',
    },
    {
      descriptionRange: 'E15:G16',
      label: 'Open Analytics',
      titleRange: 'E14:G14',
      url: buildSheetUrl_(url, analyticsSheet),
      copy: 'Inspect raw opens and clicks while keeping reporting logic unchanged.',
    },
  ];

  cards.forEach((card) => {
    mergeRange_(sheet.getRange(card.titleRange)).setFormula(buildHyperlinkFormula_(card.url, card.label));
    sheet
      .getRange(card.titleRange)
      .setBackground(theme.surface)
      .setFontFamily(theme.bodyFont)
      .setFontSize(11)
      .setFontWeight('bold')
      .setFontColor(theme.ink)
      .setHorizontalAlignment('left')
      .setVerticalAlignment('middle')
      .setBorder(true, true, false, true, false, false, theme.line);

    mergeRange_(sheet.getRange(card.descriptionRange)).setValue(card.copy);
    sheet
      .getRange(card.descriptionRange)
      .setBackground(theme.surface)
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.muted)
      .setWrap(true)
      .setVerticalAlignment('top')
      .setBorder(false, true, true, true, false, false, theme.line);
  });

  mergeRange_(sheet.getRange('B18:D18')).setValue('Live Status');
  sheet
    .getRange('B18:D18')
    .setBackground(theme.accentSoft)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.ink)
    .setFontWeight('bold')
    .setBorder(true, true, false, true, false, false, theme.line);

  mergeRange_(sheet.getRange('E18:G18')).setValue('Current Defaults');
  sheet
    .getRange('E18:G18')
    .setBackground(theme.softGold)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.ink)
    .setFontWeight('bold')
    .setBorder(true, true, false, true, false, false, theme.line);

  const statusRows = [
    ['Remaining quota', '=GET_REMAINING_QUOTA()'],
    [
      'Queue ready',
      '=IF(GET_REMAINING_QUOTA()>VALUE(IFERROR(VLOOKUP("batch_headroom",Config!A:B,2,FALSE),0)),"Ready to send","Watch headroom")',
    ],
    [
      'Queued rows',
      '=IFERROR(COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"PENDING")+COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"SCHEDULED"),0)',
    ],
    ['Error rows', '=IFERROR(COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"ERROR"),0)'],
  ];
  writeLabeledFormulaBlock_(sheet, 'B19', statusRows, theme.accentSoft);

  const defaultRows = [
    ['Sender', '=IFERROR(VLOOKUP("sender_name",Config!A:B,2,FALSE),"—")'],
    ['Template', '=IFERROR(VLOOKUP("default_template",Config!A:B,2,FALSE),"—")'],
    ['Delivery mode', '=IFERROR(VLOOKUP("default_delivery_mode",Config!A:B,2,FALSE),"—")'],
    ['Signature', '=IFERROR(VLOOKUP("signature_mode",Config!A:B,2,FALSE),"—")'],
    ['Tracking', '=IFERROR(VLOOKUP("tracking_enabled",Config!A:B,2,FALSE),"—")'],
  ];
  writeLabeledFormulaBlock_(sheet, 'E19', defaultRows, theme.softGold);

  mergeRange_(sheet.getRange('B25:G26')).setValue(
    'Run actions from the Email Tools menu. This sheet is for orientation and status, not for buttons or sends.'
  );
  sheet
    .getRange('B25:G26')
    .setBackground(theme.surfaceAlt)
    .setFontFamily(theme.bodyFont)
    .setFontSize(10)
    .setFontColor(theme.muted)
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, theme.line);

  styleStartHereTab_(sheet);
  return sheet;
}

function applyComposeSheetTheme_(sheet) {
  applySheetChrome_(sheet, 'compose');
  styleKeyValueSheet_(sheet, {
    sectionBlocks: [
      { fill: '#f4ede4', keys: ['recipient', 'subject', 'headline', 'preview_text', 'first_name', 'body_text'] },
      { fill: '#efe8df', keys: ['cta_text', 'cta_url'] },
      {
        fill: '#e2ebe5',
        keys: ['template_name', 'include_signature', 'signature_mode', 'delivery_mode', 'from_alias', 'reply_to'],
      },
      { fill: '#f6efe6', keys: ['footer_note', 'footer_company', 'footer_address', 'attachment_ids'] },
    ],
    tallKeys: ['body_text'],
    requiredKeys: ['recipient', 'subject', 'headline'],
    valueColumn: 2,
    widths: [180, 560],
  });
}

function applyConfigSheetTheme_(sheet) {
  applySheetChrome_(sheet, 'config');
  styleKeyValueSheet_(sheet, {
    descriptionColumn: 3,
    requiredKeys: [],
    sectionBlocks: [
      { fill: '#f3ebe0', keys: ['sender_name', 'reply_to', 'default_template'] },
      {
        fill: '#e3ebe6',
        keys: [
          'signature_enabled',
          'signature_mode',
          'signature_name',
          'signature_email',
          'signature_website_label',
          'signature_website_href',
          'signature_linkedin_label',
          'signature_linkedin_href',
          'signature_github_label',
          'signature_github_href',
          'signature_note',
        ],
      },
      { fill: '#f4e3da', keys: ['tracking_enabled', 'default_delivery_mode', 'from_alias'] },
      { fill: '#ece6db', keys: ['batch_max_size', 'batch_headroom'] },
    ],
    tallKeys: [],
    valueColumn: 2,
    widths: [190, 250, 430],
  });

  const rowMap = getKeyRowMap_(sheet);
  ['tracking_enabled', 'default_delivery_mode'].forEach((key) => {
    if (rowMap[key]) {
      sheet
        .getRange(rowMap[key], 2, 1, 1)
        .setBackground('#fff2ec')
        .setFontWeight('bold')
        .setBorder(true, true, true, true, false, false, WORKBOOK_THEME.line);
    }
  });
}

function applyOutboundSheetTheme_(sheet) {
  const theme = getWorkbookTheme();
  const headers = getOutboundHeadersFromSheet_(sheet);
  const lastColumn = headers.length;
  const lastRow = Math.max(sheet.getLastRow(), OUTBOUND_HEADER_ROW);
  const statusColumn = headers.indexOf('status') + 1;
  const wrapColumns = ['body_text', 'error'];
  const centerColumns = ['template_name', 'delivery_mode', 'status', 'scheduled_time', 'sent_at'];
  const widthMap = {
    attachment_ids: 190,
    body_html: 320,
    body_text: 360,
    company: 170,
    cta_text: 130,
    cta_url: 240,
    delivery_mode: 120,
    draft_id: 170,
    drafted_at: 170,
    error: 260,
    first_name: 120,
    footer_address: 190,
    footer_company: 180,
    footer_note: 220,
    from_alias: 190,
    headline: 220,
    headline_a: 170,
    headline_b: 170,
    headline_variant: 110,
    include_signature: 120,
    last_attempt_at: 170,
    preview_text: 220,
    recipient: 240,
    reply_to: 220,
    scheduled_time: 170,
    sender_name: 180,
    sent_at: 170,
    sequence_id: 120,
    signature_email: 220,
    signature_github_href: 220,
    signature_github_label: 180,
    signature_linkedin_href: 220,
    signature_linkedin_label: 180,
    signature_mode: 120,
    signature_name: 180,
    signature_note: 200,
    signature_website_href: 220,
    signature_website_label: 180,
    source_row: 100,
    source_sheet: 160,
    status: 120,
    step_number: 110,
    subject: 240,
    subject_a: 180,
    subject_b: 180,
    subject_variant: 110,
    template_name: 150,
  };

  applySheetChrome_(sheet, 'outbound');
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(5);
  sheet.setRowHeight(1, 28);
  sheet.setRowHeight(2, 34);
  setRowHeightsIfPossible_(sheet, 3, Math.max(lastRow - 2, 1), 30);

  if (typeof sheet.showColumns === 'function') {
    sheet.showColumns(1, lastColumn);
  }

  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    sheet.setColumnWidth(columnIndex + 1, widthMap[headers[columnIndex]] || 140);
  }

  const titleRange = sheet.getRange(1, 1, 1, lastColumn);
  titleRange
    .setBackground(theme.surfaceAlt)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.muted)
    .setFontWeight('bold')
    .setVerticalAlignment('middle');
  sheet.getRange('A1').setFontColor(theme.ink).setFontSize(10);

  styleHeaderRange_(sheet.getRange(2, 1, 1, lastColumn));

  if (lastRow > 2) {
    const rowCount = lastRow - 2;
    const dataRange = sheet.getRange(3, 1, rowCount, lastColumn);
    dataRange
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.ink)
      .setVerticalAlignment('top')
      .setWrap(false)
      .setBackgrounds(buildAlternatingBackgrounds_(rowCount, lastColumn, theme.surface, theme.surfaceAlt));

    wrapColumns.forEach((header) => {
      const column = headers.indexOf(header) + 1;
      if (column > 0) {
        sheet.getRange(3, column, rowCount, 1).setWrap(true);
      }
    });

    centerColumns.forEach((header) => {
      const column = headers.indexOf(header) + 1;
      if (column > 0) {
        sheet.getRange(3, column, rowCount, 1).setHorizontalAlignment('center').setVerticalAlignment('middle');
      }
    });
  }

  if (statusColumn > 0) {
    const statusRange = sheet.getRange(3, statusColumn, Math.max(lastRow - 2, 1), 1);
    statusRange.setHorizontalAlignment('center').setFontWeight('bold').setBackground('#f3eee7');
    applyOutboundStatusRules_(sheet, statusColumn);
  }

  hideAndGroupAdvancedOutboundColumns_(sheet, headers);
}

function applyAnalyticsSheetTheme_(sheet) {
  const theme = getWorkbookTheme();
  const lastRow = Math.max(sheet.getLastRow(), 1);

  applySheetChrome_(sheet, 'analytics');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 420);
  sheet.setRowHeight(1, 30);
  setRowHeightsIfPossible_(sheet, 2, Math.max(lastRow - 1, 1), 28);

  styleHeaderRange_(sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 4)));

  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 4));
    dataRange
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.ink)
      .setVerticalAlignment('top')
      .setBackgrounds(
        buildAlternatingBackgrounds_(lastRow - 1, Math.max(sheet.getLastColumn(), 4), theme.surface, '#f1f5f8')
      );
    sheet.getRange(2, 4, lastRow - 1, 1).setWrap(true);
  }
}

function ensureStartHereSheet_(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheetByName(SHEET_NAMES.start);
  if (existing) {
    return existing;
  }

  const sheetNames = ss.getSheets().map((sheet) => sheet.getName());
  const candidateName = findStartHereCandidateName(sheetNames);
  if (candidateName) {
    const candidateSheet = ss.getSheetByName(candidateName);
    if (candidateSheet && candidateName !== SHEET_NAMES.start) {
      candidateSheet.setName(SHEET_NAMES.start);
      return candidateSheet;
    }
  }

  return ss.insertSheet(SHEET_NAMES.start, 0);
}

function buildHyperlinkFormula_(url, label) {
  if (!url) {
    return `"${label}"`;
  }
  return `=HYPERLINK("${url}","${label}")`;
}

function buildSheetUrl_(spreadsheetUrl, sheet) {
  if (!spreadsheetUrl || !sheet || typeof sheet.getSheetId !== 'function') {
    return '';
  }
  return `${spreadsheetUrl}#gid=${sheet.getSheetId()}`;
}

function writeLabeledFormulaBlock_(sheet, anchorA1, rows, fill) {
  const start = parseCellReference_(anchorA1);
  const theme = getWorkbookTheme();

  rows.forEach((row, index) => {
    const rowNumber = start.row + index;
    mergeRange_(sheet.getRange(rowNumber, start.column, 1, 2)).setValue(row[0]);
    sheet
      .getRange(rowNumber, start.column, 1, 2)
      .setBackground(fill)
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.muted)
      .setFontWeight('bold')
      .setBorder(index === 0, true, true, true, false, false, theme.line);

    mergeRange_(sheet.getRange(rowNumber, start.column + 2, 1, 1)).setFormula(row[1]);
    sheet
      .getRange(rowNumber, start.column + 2, 1, 1)
      .setBackground('#fffdf8')
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.ink)
      .setHorizontalAlignment('left')
      .setBorder(index === 0, true, true, true, false, false, theme.line);
  });
}

function parseCellReference_(a1Notation) {
  const match = /^([A-Z]+)(\d+)$/.exec(
    String(a1Notation || '')
      .trim()
      .toUpperCase()
  );
  if (!match) {
    throw new Error(`Invalid cell reference: ${a1Notation}`);
  }

  let column = 0;
  match[1].split('').forEach((character) => {
    column = column * 26 + character.charCodeAt(0) - 64;
  });

  return {
    column: column,
    row: Number(match[2]),
  };
}

function breakApartUsedRange_(sheet) {
  const range = sheet.getDataRange ? sheet.getDataRange() : null;
  if (range && typeof range.breakApart === 'function') {
    range.breakApart();
  }
}

function mergeRange_(range) {
  if (typeof range.breakApart === 'function') {
    range.breakApart();
  }
  if (typeof range.merge === 'function') {
    range.merge();
  }
  return range;
}

function styleStartHereTab_(sheet) {
  const theme = getWorkbookTheme();
  if (!sheet) {
    return;
  }
  applySheetChrome_(sheet, 'start');
  sheet.setTabColor(theme.tabColors.start);
}

function reorderSheets_(spreadsheet, orderedSheetNames) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  (orderedSheetNames || []).forEach((sheetName, index) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }

    if (typeof sheet.activate === 'function' && typeof ss.moveActiveSheet === 'function') {
      sheet.activate();
      ss.moveActiveSheet(index + 1);
    }
  });
}

function applySheetChrome_(sheet, tabKey) {
  const theme = getWorkbookTheme();
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(theme.tabColors[tabKey] || theme.tabColors.start);
}

function styleKeyValueSheet_(sheet, options) {
  const theme = getWorkbookTheme();
  const config = options || {};
  const widths = config.widths || [];
  const lastColumn = widths.length || (config.descriptionColumn ? 3 : 2);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const dataRows = Math.max(lastRow - 1, 1);
  const valueColumn = config.valueColumn || 2;
  const descriptionColumn = config.descriptionColumn || 0;
  const rowMap = getKeyRowMap_(sheet);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  widths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  sheet.setRowHeight(1, 32);
  setRowHeightsIfPossible_(sheet, 2, dataRows, 30);

  styleHeaderRange_(sheet.getRange(1, 1, 1, lastColumn));

  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, dataRows, lastColumn);
    dataRange
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(theme.ink)
      .setVerticalAlignment('middle')
      .setBackground(theme.surface);

    sheet.getRange(2, 1, dataRows, 1).setFontWeight('bold').setFontColor(theme.ink).setBackground(theme.surfaceAlt);

    sheet
      .getRange(2, valueColumn, dataRows, 1)
      .setBackground(theme.editableBackground)
      .setBorder(true, true, true, true, false, false, theme.editableBorder)
      .setWrap(true);

    if (descriptionColumn > 0) {
      sheet
        .getRange(2, descriptionColumn, dataRows, 1)
        .setBackground(theme.surface)
        .setFontColor(theme.muted)
        .setWrap(true);
    }
  }

  (config.sectionBlocks || []).forEach((block) => {
    const rows = (block.keys || []).map((key) => rowMap[key]).filter(Boolean);
    if (rows.length === 0) {
      return;
    }

    const startRow = Math.min.apply(null, rows);
    const endRow = Math.max.apply(null, rows);
    sheet
      .getRange(startRow, 1, endRow - startRow + 1, lastColumn)
      .setBackground(block.fill)
      .setBorder(true, false, false, false, false, false, theme.line);
    sheet
      .getRange(startRow, valueColumn, endRow - startRow + 1, 1)
      .setBackground(theme.editableBackground)
      .setBorder(true, true, true, true, false, false, theme.editableBorder);

    if (descriptionColumn > 0) {
      sheet.getRange(startRow, descriptionColumn, endRow - startRow + 1, 1).setFontColor(theme.muted);
    }
  });

  (config.requiredKeys || []).forEach((key) => {
    const rowNumber = rowMap[key];
    if (!rowNumber) {
      return;
    }

    sheet.getRange(rowNumber, 1, 1, 1).setFontColor(theme.accent);
    sheet
      .getRange(rowNumber, valueColumn, 1, 1)
      .setBackground('#fff6ed')
      .setBorder(true, true, true, true, false, false, theme.accent);
  });

  (config.tallKeys || []).forEach((key) => {
    const rowNumber = rowMap[key];
    if (rowNumber) {
      sheet.setRowHeight(rowNumber, 94);
      sheet.getRange(rowNumber, valueColumn, 1, 1).setVerticalAlignment('top');
    }
  });
}

function getKeyRowMap_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const rowMap = {};

  if (lastRow < 2) {
    return rowMap;
  }

  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  keys.forEach((row, index) => {
    const key = String(row[0] || '').trim();
    if (key) {
      rowMap[key] = index + 2;
    }
  });

  return rowMap;
}

function getOutboundHeadersFromSheet_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), getOutboundHeaders().length);
  const values = sheet.getRange(OUTBOUND_HEADER_ROW, 1, 1, lastColumn).getValues()[0];
  return values.map((value, index) => String(value || getOutboundHeaders()[index] || '').trim()).filter(Boolean);
}

function hideAndGroupAdvancedOutboundColumns_(sheet, headers) {
  const advancedHeaders = getAdvancedOutboundHeaders();
  const hiddenIndexes = headers
    .map((header, index) => ({ header: header, index: index + 1 }))
    .filter((entry) => advancedHeaders.indexOf(entry.header) !== -1)
    .map((entry) => entry.index);

  contiguousRanges_(hiddenIndexes).forEach((range) => {
    groupAndHideColumns_(sheet, range.start, range.length);
  });
}

function groupAndHideColumns_(sheet, start, length) {
  try {
    if (typeof sheet.getColumnGroup === 'function') {
      const existingGroup = sheet.getColumnGroup(start, 1);
      if (existingGroup && typeof existingGroup.collapse === 'function') {
        existingGroup.collapse();
      } else if (typeof sheet.getRange === 'function' && typeof sheet.getMaxRows === 'function') {
        const groupRange = sheet.getRange(1, start, Math.max(sheet.getMaxRows(), 1), length);
        if (typeof groupRange.shiftColumnGroupDepth === 'function') {
          groupRange.shiftColumnGroupDepth(1);
        }
        const newGroup = sheet.getColumnGroup(start, 1);
        if (newGroup && typeof newGroup.collapse === 'function') {
          newGroup.collapse();
        }
      }
    }
  } catch (e) {
    // Grouping support varies in tests and across existing sheets.
  }

  if (typeof sheet.hideColumns === 'function') {
    sheet.hideColumns(start, length);
  }
}

function contiguousRanges_(indexes) {
  const sorted = (indexes || []).slice().sort((left, right) => left - right);
  const ranges = [];

  sorted.forEach((index) => {
    const current = ranges[ranges.length - 1];
    if (!current || current.start + current.length !== index) {
      ranges.push({ length: 1, start: index });
      return;
    }

    current.length += 1;
  });

  return ranges;
}

function buildAlternatingBackgrounds_(rowCount, columnCount, oddColor, evenColor) {
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, () => (rowIndex % 2 === 0 ? oddColor : evenColor))
  );
}

function applyOutboundStatusRules_(sheet, statusColumn) {
  const theme = getWorkbookTheme();
  const range = sheet.getRange(3, statusColumn, Math.max(sheet.getMaxRows ? sheet.getMaxRows() - 2 : 998, 1), 1);
  const rules = [
    buildStatusRule_(sheet, range, 'SENT', '#dce9de', '#385b44'),
    buildStatusRule_(sheet, range, 'DRAFTED', '#dfe7ed', '#476274'),
    buildStatusRule_(sheet, range, 'SCHEDULED', '#f1e8da', '#8d6a2f'),
    buildStatusRule_(sheet, range, 'PENDING', '#ece6db', '#6d6255'),
    buildStatusRule_(sheet, range, 'ERROR', '#f4e0da', '#924d45'),
    buildStatusRule_(sheet, range, 'DRY_RUN', '#ece8f3', '#615473'),
  ];
  if (typeof sheet.setConditionalFormatRules === 'function') {
    sheet.setConditionalFormatRules(rules);
  }
}

function buildStatusRule_(sheet, range, text, background, color) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text)
    .setBackground(background)
    .setFontColor(color)
    .setRanges([range])
    .build();
}

function styleHeaderRange_(range) {
  const theme = getWorkbookTheme();
  range
    .setBackground(theme.headerBackground)
    .setFontColor(theme.headerText)
    .setFontFamily(theme.bodyFont)
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
}

function setRowHeightsIfPossible_(sheet, startRow, count, height) {
  if (!count || count < 1 || typeof sheet.setRowHeights !== 'function') {
    return;
  }
  sheet.setRowHeights(startRow, count, height);
}

if (typeof module !== 'undefined') {
  module.exports = {
    OUTBOUND_ADVANCED_HEADERS,
    OUTBOUND_DEFAULT_VISIBLE_HEADERS,
    WORKBOOK_THEME,
    applyAnalyticsSheetTheme_,
    applyWorkbookPresentation_,
    buildAlternatingBackgrounds_,
    contiguousRanges_,
    findStartHereCandidateName,
    getAdvancedOutboundHeaders,
    getDefaultVisibleOutboundHeaders,
    getPreferredSheetOrder,
    getWorkbookTheme,
    refreshStartHereSheet_,
  };
}
