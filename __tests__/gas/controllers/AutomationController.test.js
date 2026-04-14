const path = require('node:path');

const automationControllerPath = path.resolve(process.cwd(), 'src/gas/controllers/AutomationController.js');

function loadAutomationModule(sandbox) {
  jest.resetModules();
  Object.assign(global, sandbox);
  return require(automationControllerPath);
}

describe('Automation', () => {
  let appendOutboundRows;
  let getConfig;
  let getOutboundSheetSnapshot_;
  let setValue;
  let toast;
  let automation;

  beforeEach(() => {
    appendOutboundRows = jest.fn();
    getConfig = jest.fn().mockReturnValue({
      default_template: 'TemplateBrutalist',
    });
    getOutboundSheetSnapshot_ = jest.fn().mockReturnValue({
      headers: ['recipient', 'first_name', 'delivery_mode', 'template_name', 'source_sheet', 'source_row', 'status'],
      rows: [],
    });
    setValue = jest.fn();
    toast = jest.fn();

    automation = loadAutomationModule({
      SHEET_NAMES: {
        analytics: 'Analytics',
        outbound: 'Outbound',
      },
      SpreadsheetApp: {
        getActiveSpreadsheet: jest.fn().mockReturnValue({
          toast: toast,
        }),
      },
      appendOutboundRows: appendOutboundRows,
      getConfig: getConfig,
      getOutboundSheetSnapshot_: getOutboundSheetSnapshot_,
      console: console,
    });
  });

  test('handleReadyRow_ maps the source row into Outbound and marks the source as queued', () => {
    const sourceSheet = {
      getLastColumn: jest.fn().mockReturnValue(4),
      getName: jest.fn().mockReturnValue('Leads'),
      getRange: jest.fn((row, column) => {
        if (row === 1 && column === 1) {
          return {
            getValues: jest.fn().mockReturnValue([['recipient', 'first_name', 'studio_status', 'template_name']]),
          };
        }

        if (row === 5 && column === 1) {
          return {
            getValues: jest.fn().mockReturnValue([['lead@example.com', 'Ava', 'READY', '']]),
          };
        }

        if (row === 5 && column === 3) {
          return {
            setValue: setValue,
          };
        }

        throw new Error(`Unexpected range ${row},${column}`);
      }),
    };

    automation.handleReadyRow_(sourceSheet, 5);

    expect(appendOutboundRows).toHaveBeenCalledWith([
      {
        delivery_mode: 'SEND',
        first_name: 'Ava',
        recipient: 'lead@example.com',
        source_row: 5,
        source_sheet: 'Leads',
        status: 'PENDING',
        template_name: 'TemplateBrutalist',
      },
    ]);
    expect(setValue).toHaveBeenCalledWith('QUEUED');
    expect(toast).toHaveBeenCalledWith('Row queued to Outbound!', 'Gmail Studio');
  });

  test('handleReadyRow_ skips duplicate queue entries and returns the existing row number', () => {
    getOutboundSheetSnapshot_.mockReturnValueOnce({
      headers: ['recipient', 'source_sheet', 'source_row', 'status'],
      rows: [
        {
          __rowNumber: 9,
          source_row: 5,
          source_sheet: 'Leads',
        },
      ],
    });

    const sourceSheet = {
      getLastColumn: jest.fn().mockReturnValue(3),
      getName: jest.fn().mockReturnValue('Leads'),
      getRange: jest.fn((row, column) => {
        if (row === 1 && column === 1) {
          return {
            getValues: jest.fn().mockReturnValue([['recipient', 'first_name', 'studio_status']]),
          };
        }

        if (row === 5 && column === 1) {
          return {
            getValues: jest.fn().mockReturnValue([['lead@example.com', 'Ava', 'READY']]),
          };
        }

        throw new Error(`Unexpected range ${row},${column}`);
      }),
    };

    const existingRowNumber = automation.handleReadyRow_(sourceSheet, 5);

    expect(existingRowNumber).toBe(9);
    expect(appendOutboundRows).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('Row already queued in Outbound.', 'Gmail Studio');
  });
});
