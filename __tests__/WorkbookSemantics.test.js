const schema = require('../Schema');

Object.assign(global, schema);

global.SpreadsheetApp = {
  DeveloperMetadataVisibility: { PROJECT: 'PROJECT' },
  ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' },
  newFilterCriteria: jest.fn(() => ({
    build: jest.fn(() => ({ built: true })),
  })),
};

const {
  WORKBOOK_SEMANTIC_KEYS,
  WORKBOOK_SEMANTIC_PREFIX,
  getQueueSlicerDefinitions_,
  refreshOperatorSafeguards,
  refreshQueueViews,
} = require('../WorkbookSemantics');

class FakeMetadata {
  constructor(owner, key, value) {
    this.key = key;
    this.owner = owner;
    this.removed = false;
    this.value = value;
  }

  getKey() {
    return this.key;
  }

  remove() {
    this.removed = true;
    this.owner.metadata = this.owner.metadata.filter((item) => item !== this);
  }
}

class FakeProtection {
  constructor(type) {
    this.description = '';
    this.domainEdit = false;
    this.removed = false;
    this.type = type;
    this.warningOnly = false;
  }

  canDomainEdit() {
    return this.domainEdit;
  }

  getDescription() {
    return this.description;
  }

  remove() {
    this.removed = true;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  setDomainEdit(value) {
    this.domainEdit = value;
    return this;
  }

  setWarningOnly(value) {
    this.warningOnly = value;
    return this;
  }
}

class FakeSlicer {
  constructor(anchorRow, anchorColumn) {
    this.anchorColumn = anchorColumn;
    this.anchorRow = anchorRow;
    this.backgroundColor = '';
    this.criteria = null;
    this.position = null;
    this.removed = false;
    this.title = '';
  }

  getTitle() {
    return this.title;
  }

  remove() {
    this.removed = true;
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
    return this;
  }

  setColumnFilterCriteria(columnPosition, criteria) {
    this.criteria = { columnPosition: columnPosition, criteria: criteria };
    return this;
  }

  setPosition(row, column, offsetX, offsetY) {
    this.position = { column: column, offsetX: offsetX, offsetY: offsetY, row: row };
    return this;
  }

  setTitle(title) {
    this.title = title;
    return this;
  }

  setTitleHorizontalAlignment() {
    return this;
  }
}

class FakeRange {
  constructor(sheet, startRow, startColumn, numRows, numColumns) {
    this.numColumns = numColumns;
    this.numRows = numRows;
    this.sheet = sheet;
    this.startColumn = startColumn;
    this.startRow = startRow;
  }

  addDeveloperMetadata(key, value) {
    const metadata = new FakeMetadata(this.sheet.parent, key, value);
    this.sheet.parent.metadata.push(metadata);
    return this;
  }

  getValues() {
    const values = [];
    for (let rowOffset = 0; rowOffset < this.numRows; rowOffset += 1) {
      const row = [];
      for (let columnOffset = 0; columnOffset < this.numColumns; columnOffset += 1) {
        const sourceRow = this.sheet.values[this.startRow + rowOffset - 1] || [];
        row.push(sourceRow[this.startColumn + columnOffset - 1] || '');
      }
      values.push(row);
    }
    return values;
  }

  protect() {
    const protection = new FakeProtection('RANGE');
    this.sheet.rangeProtections.push(protection);
    return protection;
  }
}

class FakeSheet {
  constructor(name, values, spreadsheet) {
    this.name = name;
    this.parent = spreadsheet;
    this.rangeProtections = [];
    this.sheetProtections = [];
    this.slicers = [];
    this.values = values;
  }

  addDeveloperMetadata(key, value) {
    const metadata = new FakeMetadata(this.parent, key, value);
    this.parent.metadata.push(metadata);
    return this;
  }

  getLastColumn() {
    return Math.max(1, ...this.values.map((row) => row.length || 0));
  }

  getLastRow() {
    return Math.max(this.values.length, 1);
  }

  getMaxRows() {
    return 200;
  }

  getName() {
    return this.name;
  }

  getProtections(type) {
    return type === SpreadsheetApp.ProtectionType.SHEET ? this.sheetProtections : this.rangeProtections;
  }

  getRange(startRow, startColumn, numRows, numColumns) {
    return new FakeRange(this, startRow, startColumn, numRows, numColumns);
  }

  getSlicers() {
    return this.slicers.slice();
  }

  insertSlicer(range, anchorRow, anchorColumn) {
    const slicer = new FakeSlicer(anchorRow, anchorColumn);
    slicer.range = range;
    this.slicers.push(slicer);
    return slicer;
  }

  protect() {
    const protection = new FakeProtection('SHEET');
    this.sheetProtections.push(protection);
    return protection;
  }
}

class FakeSpreadsheet {
  constructor() {
    this.metadata = [];
    this.sheets = [];
    this.toastMessages = [];
  }

  createDeveloperMetadataFinder() {
    const spreadsheet = this;
    return {
      key: '',
      withKey(key) {
        this.key = key;
        return this;
      },
      find() {
        return spreadsheet.metadata.filter((metadata) => metadata.getKey() === this.key);
      },
    };
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }

  toast(message) {
    this.toastMessages.push(message);
  }
}

function buildSpreadsheet() {
  const spreadsheet = new FakeSpreadsheet();
  const outboundHeaders = schema.getOutboundHeaders();

  spreadsheet.sheets = [
    new FakeSheet('Start Here', [[''], [''], ['']], spreadsheet),
    new FakeSheet(
      'Compose',
      [
        ['field', 'value'],
        ['recipient', 'alex@example.com'],
        ['subject', 'Hello'],
      ],
      spreadsheet
    ),
    new FakeSheet(
      'Outbound',
      [['queue status'], outboundHeaders, new Array(outboundHeaders.length).fill('')],
      spreadsheet
    ),
    new FakeSheet(
      'Config',
      [
        ['Setting', 'Value', 'Description'],
        ['sender_name', 'Wyatt', 'Name'],
      ],
      spreadsheet
    ),
    new FakeSheet(
      'Analytics',
      [
        ['Timestamp', 'Email', 'Event Type', 'Detail'],
        ['2026-04-14', 'alex@example.com', 'OPEN', ''],
      ],
      spreadsheet
    ),
  ];

  return spreadsheet;
}

describe('WorkbookSemantics', () => {
  test('refreshOperatorSafeguards tags semantic anchors and warning-only protections', () => {
    const spreadsheet = buildSpreadsheet();

    const result = refreshOperatorSafeguards(spreadsheet);

    expect(result.metadataAnchors).toBeGreaterThan(10);
    expect(result.protections).toBe(8);
    expect(spreadsheet.metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: WORKBOOK_SEMANTIC_KEYS.role, value: 'start' }),
        expect.objectContaining({ key: WORKBOOK_SEMANTIC_KEYS.role, value: 'compose' }),
        expect.objectContaining({ key: WORKBOOK_SEMANTIC_KEYS.zone, value: 'advanced_group' }),
        expect.objectContaining({ key: WORKBOOK_SEMANTIC_KEYS.zone, value: 'status_column' }),
      ])
    );

    const startSheet = spreadsheet.getSheetByName('Start Here');
    const composeSheet = spreadsheet.getSheetByName('Compose');

    expect(startSheet.sheetProtections[0].warningOnly).toBe(true);
    expect(startSheet.sheetProtections[0].description).toContain(WORKBOOK_SEMANTIC_PREFIX);
    expect(composeSheet.rangeProtections).toHaveLength(2);
    expect(spreadsheet.toastMessages).toContain('Operator safeguards refreshed.');
  });

  test('refreshQueueViews recreates managed slicers for the core queue controls', () => {
    const spreadsheet = buildSpreadsheet();
    const outboundSheet = spreadsheet.getSheetByName('Outbound');

    const staleManagedSlicer = new FakeSlicer(3, 50);
    staleManagedSlicer.setTitle('Gmail Studio :: Status');
    const foreignSlicer = new FakeSlicer(9, 50);
    foreignSlicer.setTitle('Do Not Touch');
    outboundSheet.slicers = [staleManagedSlicer, foreignSlicer];

    const result = refreshQueueViews(spreadsheet);

    expect(result.removed).toBe(1);
    expect(result.created).toBe(3);
    expect(staleManagedSlicer.removed).toBe(true);
    expect(foreignSlicer.removed).toBe(false);
    expect(
      outboundSheet.slicers.filter((slicer) => slicer.title.startsWith('Gmail Studio ::') && !slicer.removed)
    ).toHaveLength(3);
  });

  test('getQueueSlicerDefinitions_ uses status, template, and delivery columns only', () => {
    const definitions = getQueueSlicerDefinitions_(schema.getOutboundHeaders(), schema.getOutboundHeaders().length);

    expect(definitions.map((definition) => definition.title)).toEqual([
      'Gmail Studio :: Status',
      'Gmail Studio :: Template',
      'Gmail Studio :: Delivery',
    ]);
    expect(definitions.every((definition) => definition.anchorColumn === schema.getOutboundHeaders().length + 2)).toBe(
      true
    );
  });
});
