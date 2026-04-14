const WORKBOOK_THEME = Object.freeze({
  accent: '#7a6755',
  accentSoft: '#ece0d2',
  analyticsPanel: '#e5edf3',
  bodyFont: 'Arial',
  composePanel: '#f4ece2',
  composePanelAlt: '#ede3d6',
  configPanel: '#f1e6d8',
  configPanelAlt: '#e6ece7',
  editableBackground: '#fffdf8',
  editableBorder: '#c6b7a7',
  headerBackground: '#67584a',
  headerText: '#fff8ef',
  heroPanel: '#f6efe5',
  heroBorder: '#d7c6b3',
  infoPanel: '#fbf8f2',
  ink: '#24211d',
  line: '#d9cbbb',
  muted: '#686056',
  queuePanel: '#e6efe7',
  riskPanel: '#f4e1db',
  softGold: '#efe0c7',
  surface: '#fcf8f1',
  surfaceAlt: '#f4ece2',
  tabColors: Object.freeze({
    analytics: '#7d95a7',
    compose: '#ad785b',
    config: '#918679',
    outbound: '#6f8b73',
    start: '#9b6a4e',
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
    composePanel: WORKBOOK_THEME.composePanel,
    composePanelAlt: WORKBOOK_THEME.composePanelAlt,
    configPanel: WORKBOOK_THEME.configPanel,
    configPanelAlt: WORKBOOK_THEME.configPanelAlt,
    editableBackground: WORKBOOK_THEME.editableBackground,
    editableBorder: WORKBOOK_THEME.editableBorder,
    headerBackground: WORKBOOK_THEME.headerBackground,
    headerText: WORKBOOK_THEME.headerText,
    heroBorder: WORKBOOK_THEME.heroBorder,
    heroPanel: WORKBOOK_THEME.heroPanel,
    infoPanel: WORKBOOK_THEME.infoPanel,
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
    [2, 170],
    [3, 170],
    [4, 170],
    [5, 170],
    [6, 170],
    [7, 170],
    [8, 28],
  ].forEach(([column, width]) => {
    sheet.setColumnWidth(column, width);
  });

  setRowHeightsIfPossible_(sheet, 1, 30, 18);
  [
    [2, 36],
    [3, 30],
    [4, 30],
    [5, 12],
    [6, 30],
    [7, 30],
    [8, 30],
    [9, 12],
    [10, 26],
    [11, 28],
    [12, 28],
    [13, 12],
    [14, 26],
    [15, 28],
    [16, 28],
    [17, 12],
    [18, 24],
    [19, 24],
    [20, 24],
    [21, 24],
    [22, 24],
    [23, 24],
    [24, 24],
    [25, 22],
    [26, 22],
  ].forEach(([row, height]) => sheet.setRowHeight(row, height));

  mergeRange_(sheet.getRange('B2:G2')).setValue('Gmail Studio');
  sheet
    .getRange('B2:G2')
    .setBackground(theme.heroPanel)
    .setFontFamily(theme.bodyFont)
    .setFontSize(24)
    .setFontWeight('bold')
    .setFontColor(theme.headerBackground)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, theme.heroBorder);

  mergeRange_(sheet.getRange('B3:G4')).setValue(
    'A warm command center for drafts, queue sends, and analytics. Configure once, test in Compose, then run the queue when it is ready.'
  );
  sheet
    .getRange('B3:G4')
    .setBackground(theme.infoPanel)
    .setFontFamily(theme.bodyFont)
    .setFontSize(12)
    .setFontColor(theme.muted)
    .setWrap(true)
    .setVerticalAlignment('top')
    .setBorder(false, true, true, true, false, false, theme.line);

  const steps = [
    {
      range: 'B6:C8',
      eyebrow: '1 / Configure',
      body: 'Set sender defaults, signature style, delivery mode, and batch headroom in Config.',
      fill: theme.softGold,
    },
    {
      range: 'D6:E8',
      eyebrow: '2 / Draft + Test',
      body: 'Use Compose to preview a one-off message, then create a safe draft or test send.',
      fill: theme.composePanel,
    },
    {
      range: 'F6:G8',
      eyebrow: '3 / Queue + Send',
      body: 'Review Outbound, check status, and send only when the queue is ready.',
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
      copy: 'Draft a one-off message, preview the HTML, and create a safe draft.',
    },
    {
      descriptionRange: 'E11:G12',
      label: 'Open Outbound',
      titleRange: 'E10:G10',
      url: buildSheetUrl_(url, outboundSheet),
      copy: 'Scan the queue, confirm status, and send when the sheet is ready.',
    },
    {
      descriptionRange: 'B15:D16',
      label: 'Open Config',
      titleRange: 'B14:D14',
      url: buildSheetUrl_(url, configSheet),
      copy: 'Tune sender identity, templates, tracking, and delivery defaults.',
    },
    {
      descriptionRange: 'E15:G16',
      label: 'Open Analytics',
      titleRange: 'E14:G14',
      url: buildSheetUrl_(url, analyticsSheet),
      copy: 'Review raw events without changing the reporting pipeline.',
    },
  ];

  cards.forEach((card) => {
    mergeRange_(sheet.getRange(card.titleRange)).setFormula(buildHyperlinkFormula_(card.url, card.label));
    sheet
      .getRange(card.titleRange)
      .setBackground(theme.infoPanel)
      .setFontFamily(theme.bodyFont)
      .setFontSize(11)
      .setFontWeight('bold')
      .setFontColor(theme.headerBackground)
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

  mergeRange_(sheet.getRange('B18:D18')).setValue('Live Queue');
  sheet
    .getRange('B18:D18')
    .setBackground(theme.accentSoft)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.headerBackground)
    .setFontWeight('bold')
    .setBorder(true, true, false, true, false, false, theme.line);

  mergeRange_(sheet.getRange('E18:G18')).setValue('Active Defaults');
  sheet
    .getRange('E18:G18')
    .setBackground(theme.softGold)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.headerBackground)
    .setFontWeight('bold')
    .setBorder(true, true, false, true, false, false, theme.line);

  const statusRows = [
    ['Remaining quota', '=GET_REMAINING_QUOTA()'],
    [
      'Queue headroom',
      '=IF(GET_REMAINING_QUOTA()>VALUE(IFERROR(VLOOKUP("batch_headroom",Config!A:B,2,FALSE),0)),"Ready to send","Watch headroom")',
    ],
    [
      'Queued rows',
      '=IFERROR(COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"PENDING")+COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"SCHEDULED"),0)',
    ],
    ['Drafted rows', '=IFERROR(COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"DRAFTED"),0)'],
    ['Error rows', '=IFERROR(COUNTIF(INDEX(Outbound!A:AZ,0,MATCH("status",Outbound!2:2,0)),"ERROR"),0)'],
  ];
  writeLabeledFormulaBlock_(sheet, 'B19', statusRows, theme.accentSoft, {
    labelFill: theme.accentSoft,
    valueFill: theme.infoPanel,
    valueWeight: 'bold',
  });

  const defaultRows = [
    ['Sender', '=IFERROR(VLOOKUP("sender_name",Config!A:B,2,FALSE),"—")'],
    ['Template', '=IFERROR(VLOOKUP("default_template",Config!A:B,2,FALSE),"—")'],
    ['Delivery mode', '=IFERROR(VLOOKUP("default_delivery_mode",Config!A:B,2,FALSE),"—")'],
    ['Signature', '=IFERROR(VLOOKUP("signature_mode",Config!A:B,2,FALSE),"—")'],
    ['Tracking', '=IFERROR(VLOOKUP("tracking_enabled",Config!A:B,2,FALSE),"—")'],
    ['Batch headroom', '=IFERROR(VLOOKUP("batch_headroom",Config!A:B,2,FALSE),"—")'],
  ];
  writeLabeledFormulaBlock_(sheet, 'E19', defaultRows, theme.softGold, {
    labelFill: theme.softGold,
    valueFill: theme.editableBackground,
    valueWeight: 'bold',
  });

  mergeRange_(sheet.getRange('B25:G26')).setValue(
    'Use the Email Tools menu for actions. This sheet is for orientation, not execution.'
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
  const theme = getWorkbookTheme();
  applySheetChrome_(sheet, 'compose');
  styleKeyValueSheet_(sheet, {
    sectionBlocks: [
      {
        fill: theme.composePanel,
        keys: ['recipient', 'subject', 'headline', 'preview_text', 'first_name', 'body_text'],
      },
      { fill: theme.composePanelAlt, keys: ['cta_text', 'cta_url'] },
      {
        fill: theme.queuePanel,
        keys: ['template_name', 'include_signature', 'signature_mode', 'delivery_mode', 'from_alias', 'reply_to'],
      },
      { fill: theme.infoPanel, keys: ['footer_note', 'footer_company', 'footer_address', 'attachment_ids'] },
    ],
    tallKeys: ['body_text'],
    requiredKeys: ['recipient', 'subject', 'headline'],
    valueColumn: 2,
    valueFill: theme.editableBackground,
    labelFill: theme.surfaceAlt,
    widths: [180, 560],
  });
}

function applyConfigSheetTheme_(sheet) {
  const theme = getWorkbookTheme();
  applySheetChrome_(sheet, 'config');
  styleKeyValueSheet_(sheet, {
    descriptionColumn: 3,
    requiredKeys: [],
    sectionBlocks: [
      { fill: theme.configPanel, keys: ['sender_name', 'reply_to', 'default_template'] },
      {
        fill: theme.configPanelAlt,
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
      { fill: theme.accentSoft, keys: ['tracking_enabled', 'default_delivery_mode', 'from_alias'] },
      { fill: theme.softGold, keys: ['batch_max_size', 'batch_headroom'] },
    ],
    tallKeys: [],
    valueColumn: 2,
    descriptionFill: theme.infoPanel,
    labelFill: theme.surfaceAlt,
    valueFill: theme.editableBackground,
    widths: [190, 250, 430],
  });

  const rowMap = getKeyRowMap_(sheet);
  ['tracking_enabled', 'default_delivery_mode'].forEach((key) => {
    if (rowMap[key]) {
      sheet
        .getRange(rowMap[key], 2, 1, 1)
        .setBackground(theme.softGold)
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
  sheet.setFrozenColumns(4);
  sheet.setRowHeight(1, 30);
  sheet.setRowHeight(2, 36);
  setRowHeightsIfPossible_(sheet, 3, Math.max(lastRow - 2, 1), 31);

  if (typeof sheet.showColumns === 'function') {
    sheet.showColumns(1, lastColumn);
  }

  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    sheet.setColumnWidth(columnIndex + 1, widthMap[headers[columnIndex]] || 140);
  }

  const titleRange = sheet.getRange(1, 1, 1, lastColumn);
  titleRange
    .setBackground(theme.infoPanel)
    .setFontFamily(theme.bodyFont)
    .setFontColor(theme.muted)
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setBorder(false, false, true, false, false, false, theme.line);
  sheet.getRange('A1').setFontColor(theme.headerBackground).setFontSize(10).setFontWeight('bold');

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
    statusRange
      .setHorizontalAlignment('center')
      .setFontWeight('bold')
      .setFontColor(theme.headerBackground)
      .setBackground(theme.surfaceAlt);
    applyOutboundStatusRules_(sheet, statusColumn);
  }

  hideAndGroupAdvancedOutboundColumns_(sheet, headers);
  emphasizeOutboundAdvancedBoundary_(sheet, headers, lastRow);
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
        buildAlternatingBackgrounds_(lastRow - 1, Math.max(sheet.getLastColumn(), 4), theme.surface, theme.surfaceAlt)
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

function writeLabeledFormulaBlock_(sheet, anchorA1, rows, fill, options) {
  const start = parseCellReference_(anchorA1);
  const theme = getWorkbookTheme();
  const config = options || {};
  const labelFill = config.labelFill || fill;
  const valueFill = config.valueFill || theme.editableBackground;
  const labelColor = config.labelColor || theme.muted;
  const valueColor = config.valueColor || theme.ink;
  const valueWeight = config.valueWeight || 'normal';

  rows.forEach((row, index) => {
    const rowNumber = start.row + index;
    mergeRange_(sheet.getRange(rowNumber, start.column, 1, 2)).setValue(row[0]);
    sheet
      .getRange(rowNumber, start.column, 1, 2)
      .setBackground(labelFill)
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(labelColor)
      .setFontWeight('bold')
      .setBorder(index === 0, true, true, true, false, false, theme.line);

    mergeRange_(sheet.getRange(rowNumber, start.column + 2, 1, 1)).setFormula(row[1]);
    sheet
      .getRange(rowNumber, start.column + 2, 1, 1)
      .setBackground(valueFill)
      .setFontFamily(theme.bodyFont)
      .setFontSize(10)
      .setFontColor(valueColor)
      .setFontWeight(valueWeight)
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
  const labelFill = config.labelFill || theme.surfaceAlt;
  const valueFill = config.valueFill || theme.editableBackground;
  const descriptionFill = config.descriptionFill || theme.infoPanel;
  const labelColor = config.labelColor || theme.muted;
  const valueColor = config.valueColor || theme.ink;
  const descriptionColor = config.descriptionColor || theme.muted;
  const requiredFill = config.requiredFill || theme.heroPanel;
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

    sheet.getRange(2, 1, dataRows, 1).setFontWeight('bold').setFontColor(labelColor).setBackground(labelFill);

    sheet
      .getRange(2, valueColumn, dataRows, 1)
      .setBackground(valueFill)
      .setBorder(true, true, true, true, false, false, theme.editableBorder)
      .setFontColor(valueColor)
      .setHorizontalAlignment('left')
      .setWrap(true);

    if (descriptionColumn > 0) {
      sheet
        .getRange(2, descriptionColumn, dataRows, 1)
        .setBackground(descriptionFill)
        .setFontColor(descriptionColor)
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
      .getRange(startRow, 1, endRow - startRow + 1, 1)
      .setBackground(block.labelFill || block.fill || labelFill)
      .setFontColor(block.labelColor || labelColor);
    sheet
      .getRange(startRow, valueColumn, endRow - startRow + 1, 1)
      .setBackground(block.valueFill || valueFill)
      .setBorder(true, true, true, true, false, false, block.valueBorder || theme.editableBorder)
      .setFontColor(block.valueColor || valueColor);

    if (descriptionColumn > 0) {
      sheet
        .getRange(startRow, descriptionColumn, endRow - startRow + 1, 1)
        .setBackground(block.descriptionFill || descriptionFill)
        .setFontColor(block.descriptionColor || descriptionColor);
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
      .setBackground(requiredFill)
      .setBorder(true, true, true, true, false, false, theme.accent)
      .setFontColor(valueColor);
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
    buildStatusRule_(sheet, range, 'SENT', theme.queuePanel, '#40624a'),
    buildStatusRule_(sheet, range, 'DRAFTED', theme.analyticsPanel, '#4e6576'),
    buildStatusRule_(sheet, range, 'SCHEDULED', theme.softGold, '#8b6e42'),
    buildStatusRule_(sheet, range, 'PENDING', theme.surfaceAlt, '#6c6255'),
    buildStatusRule_(sheet, range, 'ERROR', theme.riskPanel, '#9a4f48'),
    buildStatusRule_(sheet, range, 'DRY_RUN', '#ebe7f1', '#615675'),
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
    .setVerticalAlignment('middle')
    .setBorder(true, false, true, false, false, false, theme.line);
}

function setRowHeightsIfPossible_(sheet, startRow, count, height) {
  if (!count || count < 1 || typeof sheet.setRowHeights !== 'function') {
    return;
  }
  sheet.setRowHeights(startRow, count, height);
}

function emphasizeOutboundAdvancedBoundary_(sheet, headers, lastRow) {
  const advancedHeaders = getAdvancedOutboundHeaders();
  const firstAdvancedIndex = headers.findIndex((header) => advancedHeaders.indexOf(header) !== -1);
  if (firstAdvancedIndex < 0) {
    return;
  }

  const boundaryColumn = firstAdvancedIndex + 1;
  const separatorColumn = Math.max(boundaryColumn - 1, 1);
  const rowCount = Math.max(lastRow, OUTBOUND_HEADER_ROW);
  try {
    sheet
      .getRange(1, separatorColumn, rowCount, 1)
      .setBorder(false, true, false, false, false, false, getWorkbookTheme().line);
  } catch (e) {
    // Boundary styling is cosmetic only.
  }
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
