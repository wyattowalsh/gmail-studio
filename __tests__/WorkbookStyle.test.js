const schema = require('../Schema');

Object.assign(global, schema);

global.SpreadsheetApp = {
  newConditionalFormatRule: jest.fn(() => {
    const rule = {
      build: jest.fn(() => ({ built: true })),
      setBackground: jest.fn(() => rule),
      setFontColor: jest.fn(() => rule),
      setRanges: jest.fn(() => rule),
      whenTextEqualTo: jest.fn(() => rule),
    };
    return rule;
  }),
};

const { applyWorkbookPresentation_, findStartHereCandidateName, refreshStartHereSheet_ } = require('../WorkbookStyle');

function columnToNumber(letters) {
  return String(letters)
    .split('')
    .reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0);
}

function parseRange(input) {
  const match = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(
    String(input || '')
      .trim()
      .toUpperCase()
  );
  if (!match) {
    throw new Error(`Unsupported range: ${input}`);
  }

  const startColumn = columnToNumber(match[1]);
  const startRow = Number(match[2]);
  const endColumn = match[3] ? columnToNumber(match[3]) : startColumn;
  const endRow = match[4] ? Number(match[4]) : startRow;

  return {
    numColumns: endColumn - startColumn + 1,
    numRows: endRow - startRow + 1,
    startColumn: startColumn,
    startRow: startRow,
  };
}

function ensureSize(values, row, column) {
  while (values.length < row) {
    values.push([]);
  }
  while (values[row - 1].length < column) {
    values[row - 1].push('');
  }
}

class FakeRange {
  constructor(sheet, startRow, startColumn, numRows, numColumns) {
    this.sheet = sheet;
    this.startRow = startRow;
    this.startColumn = startColumn;
    this.numRows = numRows;
    this.numColumns = numColumns;
  }

  breakApart() {
    this.sheet.breakApartCalls += 1;
    return this;
  }

  buildMatrix(valueFactory) {
    return Array.from({ length: this.numRows }, (_, rowIndex) =>
      Array.from({ length: this.numColumns }, (_, columnIndex) => valueFactory(rowIndex, columnIndex))
    );
  }

  getValues() {
    return this.buildMatrix((rowOffset, columnOffset) => {
      const row = this.sheet.values[this.startRow + rowOffset - 1] || [];
      return row[this.startColumn + columnOffset - 1] || '';
    });
  }

  merge() {
    this.sheet.mergeCalls += 1;
    return this;
  }

  setBackground() {
    return this;
  }

  setBackgrounds() {
    return this;
  }

  setBorder() {
    return this;
  }

  setDataValidation() {
    return this;
  }

  setFontColor() {
    return this;
  }

  setFontFamily() {
    return this;
  }

  setFontSize() {
    return this;
  }

  setFontWeight() {
    return this;
  }

  setFormula(formula) {
    ensureSize(this.sheet.values, this.startRow, this.startColumn);
    this.sheet.values[this.startRow - 1][this.startColumn - 1] = formula;
    return this;
  }

  setHorizontalAlignment() {
    return this;
  }

  setValue(value) {
    ensureSize(this.sheet.values, this.startRow, this.startColumn);
    this.sheet.values[this.startRow - 1][this.startColumn - 1] = value;
    return this;
  }

  setValues(matrix) {
    matrix.forEach((row, rowOffset) => {
      row.forEach((value, columnOffset) => {
        const targetRow = this.startRow + rowOffset;
        const targetColumn = this.startColumn + columnOffset;
        ensureSize(this.sheet.values, targetRow, targetColumn);
        this.sheet.values[targetRow - 1][targetColumn - 1] = value;
      });
    });
    return this;
  }

  setVerticalAlignment() {
    return this;
  }

  setWrap() {
    return this;
  }

  shiftColumnGroupDepth() {
    this.sheet.groupDepthCalls += 1;
    return this;
  }
}

class FakeSheet {
  constructor(name, values, id, spreadsheet) {
    this.breakApartCalls = 0;
    this.clearCalls = 0;
    this.groupDepthCalls = 0;
    this.hiddenColumns = [];
    this.id = id;
    this.mergeCalls = 0;
    this.name = name;
    this.parent = spreadsheet;
    this.rowHeightCalls = [];
    this.rules = [];
    this.tabColor = '';
    this.values = values;
  }

  activate() {
    this.parent.activeSheet = this;
    return this;
  }

  clear() {
    this.clearCalls += 1;
    this.values = [['']];
    return this;
  }

  clearNotes() {
    return this;
  }

  getColumnGroup() {
    return null;
  }

  getDataRange() {
    return new FakeRange(this, 1, 1, this.getLastRow(), this.getLastColumn());
  }

  getLastColumn() {
    return Math.max(1, ...this.values.map((row) => row.length || 0));
  }

  getLastRow() {
    return Math.max(this.values.length, 1);
  }

  getMaxColumns() {
    return Math.max(26, this.getLastColumn());
  }

  getMaxRows() {
    return 200;
  }

  getName() {
    return this.name;
  }

  getRange() {
    if (typeof arguments[0] === 'string') {
      const parsed = parseRange(arguments[0]);
      return new FakeRange(this, parsed.startRow, parsed.startColumn, parsed.numRows, parsed.numColumns);
    }

    return new FakeRange(this, arguments[0], arguments[1], arguments[2], arguments[3]);
  }

  getSheetId() {
    return this.id;
  }

  hideColumns(start, length) {
    this.hiddenColumns.push({ length: length, start: start });
    return this;
  }

  setColumnWidth() {
    return this;
  }

  setConditionalFormatRules(rules) {
    this.rules = rules;
    return this;
  }

  setFrozenColumns() {
    return this;
  }

  setFrozenRows() {
    return this;
  }

  setHiddenGridlines() {
    return this;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setRowHeight(row, height) {
    this.rowHeightCalls.push({ height: height, row: row });
    return this;
  }

  setRowHeights(startRow, count, height) {
    this.rowHeightCalls.push({ count: count, height: height, row: startRow });
    return this;
  }

  setTabColor(color) {
    this.tabColor = color;
    return this;
  }

  showColumns() {
    return this;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.activeSheet = null;
    this.sheets = sheets;
    this.sheets.forEach((sheet) => {
      sheet.parent = this;
    });
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }

  getSheets() {
    return this.sheets.slice();
  }

  getUrl() {
    return 'https://docs.google.com/spreadsheets/d/fake/edit';
  }

  insertSheet(name, index) {
    const sheet = new FakeSheet(name, [['']], this.sheets.length + 100, this);
    if (typeof index === 'number') {
      this.sheets.splice(index, 0, sheet);
    } else {
      this.sheets.push(sheet);
    }
    return sheet;
  }

  moveActiveSheet(position) {
    if (!this.activeSheet) {
      return this;
    }

    const currentIndex = this.sheets.indexOf(this.activeSheet);
    this.sheets.splice(currentIndex, 1);
    this.sheets.splice(position - 1, 0, this.activeSheet);
    return this;
  }
}

function buildWorkbook(withImportTemplate) {
  const sheets = [];
  const composeSheet = new FakeSheet(
    'Compose',
    [
      ['field', 'value'],
      ['recipient', 'alex@example.com'],
      ['subject', 'Hello'],
      ['headline', 'Warm hello'],
      ['body_text', 'Hi there'],
    ],
    2
  );
  const outboundHeaders = schema.getOutboundHeaders();
  const outboundSheet = new FakeSheet(
    'Outbound',
    [
      ['queue formula'],
      outboundHeaders,
      [
        'alex@example.com',
        'Alex',
        'Acme',
        'Subject',
        '',
        '',
        'Headline',
        '',
        '',
        'Body text',
        '',
        'Preview',
        '',
        '',
        'TemplatePersonalNote',
        '',
        '',
        '',
        '',
        'DRAFT',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'PENDING',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
    ],
    3
  );
  const configSheet = new FakeSheet(
    'Config',
    [
      ['Setting', 'Value', 'Description'],
      ['sender_name', 'Wyatt Walsh', 'Name'],
      ['default_template', 'TemplatePersonalNote', 'Template'],
      ['default_delivery_mode', 'DRAFT', 'Mode'],
      ['tracking_enabled', 'FALSE', 'Tracking'],
    ],
    4
  );
  const analyticsSheet = new FakeSheet(
    'Analytics',
    [
      ['Timestamp', 'Email', 'Event Type', 'Detail'],
      ['2026-04-14', 'alex@example.com', 'OPEN', ''],
    ],
    5
  );

  sheets.push(composeSheet);
  sheets.push(outboundSheet);
  sheets.push(configSheet);
  sheets.push(analyticsSheet);

  if (withImportTemplate) {
    sheets.unshift(
      new FakeSheet('Email Studio Import Template', [['Email Studio Import Template'], ['Old landing content']], 1)
    );
  } else {
    sheets.unshift(new FakeSheet('Start Here', [['Start']], 1));
  }

  return new FakeSpreadsheet(sheets);
}

describe('WorkbookStyle', () => {
  test('findStartHereCandidateName prefers an import or welcome sheet', () => {
    expect(
      findStartHereCandidateName(['Compose', 'Outbound', 'Config', 'Analytics', 'Email Studio Import Template'])
    ).toBe('Email Studio Import Template');
  });

  test('applyWorkbookPresentation_ preserves core sheet data while restyling', () => {
    const spreadsheet = buildWorkbook(false);
    const outboundBefore = spreadsheet
      .getSheetByName('Outbound')
      .getRange(2, 1, 1, schema.getOutboundHeaders().length)
      .getValues();

    applyWorkbookPresentation_(spreadsheet, { rebuildStartHere: true });

    expect(spreadsheet.getSheetByName('Compose').clearCalls).toBe(0);
    expect(spreadsheet.getSheetByName('Config').clearCalls).toBe(0);
    expect(spreadsheet.getSheetByName('Outbound').clearCalls).toBe(0);
    expect(spreadsheet.getSheetByName('Analytics').clearCalls).toBe(0);
    expect(
      spreadsheet.getSheetByName('Outbound').getRange(2, 1, 1, schema.getOutboundHeaders().length).getValues()
    ).toEqual(outboundBefore);
    expect(spreadsheet.getSheetByName('Outbound').hiddenColumns.length).toBeGreaterThan(0);
    expect(spreadsheet.getSheets()[0].getName()).toBe('Start Here');
  });

  test('refreshStartHereSheet_ upgrades an imported intro sheet into Start Here', () => {
    const spreadsheet = buildWorkbook(true);

    const startSheet = refreshStartHereSheet_(spreadsheet);

    expect(startSheet.getName()).toBe('Start Here');
    expect(spreadsheet.getSheetByName('Start Here')).toBe(startSheet);
    expect(startSheet.clearCalls).toBe(1);
    expect(startSheet.values[1][1]).toBe('Gmail Studio');
  });
});
