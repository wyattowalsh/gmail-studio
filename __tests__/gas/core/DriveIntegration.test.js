const path = require('node:path');

const driveIntegrationPath = path.resolve(process.cwd(), 'src/gas/core/DriveIntegration.js');

function loadDriveIntegration(globals) {
  jest.resetModules();
  Object.assign(global, globals);
  return require(driveIntegrationPath);
}

describe('DriveIntegration', () => {
  afterEach(() => {
    delete global.PropertiesService;
    delete global.ScriptApp;
  });

  test('getDrivePickerConfig returns a disabled readiness payload without picker config', () => {
    const { getDrivePickerConfig } = loadDriveIntegration({
      ScriptApp: {
        AuthMode: { FULL: 'FULL' },
        AuthorizationStatus: { NOT_REQUIRED: 'NOT_REQUIRED', REQUIRED: 'REQUIRED' },
        getAuthorizationInfo: jest.fn(() => ({
          getAuthorizationStatus: () => 'NOT_REQUIRED',
        })),
        getOAuthToken: jest.fn(() => ''),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: () => '',
        }),
      },
    });

    expect(getDrivePickerConfig()).toEqual(
      expect.objectContaining({
        authorizationStatus: 'disabled',
        developerKey: '',
        helpText: expect.stringContaining('Add Picker configuration'),
        pickerEnabled: false,
        token: '',
      })
    );
  });

  test('getDrivePickerConfig returns a needs_authorization payload with missing scopes when auth is required', () => {
    const { getDrivePickerConfig } = loadDriveIntegration({
      ScriptApp: {
        AuthMode: { FULL: 'FULL' },
        AuthorizationStatus: { NOT_REQUIRED: 'NOT_REQUIRED', REQUIRED: 'REQUIRED' },
        getAuthorizationInfo: jest.fn(() => ({
          getAuthorizationStatus: () => 'REQUIRED',
        })),
        getOAuthToken: jest.fn(() => 'token-123'),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key) => ({ PICKER_DEVELOPER_KEY: 'dev-key' })[key] || '',
        }),
      },
    });

    expect(getDrivePickerConfig()).toEqual(
      expect.objectContaining({
        authorizationStatus: 'needs_authorization',
        developerKey: 'dev-key',
        missingScopes: ['https://www.googleapis.com/auth/drive.readonly'],
        pickerEnabled: false,
        token: 'token-123',
      })
    );
  });

  test('getDrivePickerConfig returns a ready payload when picker config and authorization are both available', () => {
    const { getDrivePickerConfig } = loadDriveIntegration({
      ScriptApp: {
        AuthMode: { FULL: 'FULL' },
        AuthorizationStatus: { NOT_REQUIRED: 'NOT_REQUIRED', REQUIRED: 'REQUIRED' },
        getAuthorizationInfo: jest.fn(() => ({
          getAuthorizationStatus: () => 'NOT_REQUIRED',
        })),
        getOAuthToken: jest.fn(() => 'token-123'),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key) =>
            ({
              PICKER_APP_ID: 'picker-app-id',
              PICKER_DEVELOPER_KEY: 'dev-key',
              PICKER_ORIGIN: 'https://docs.google.com',
            })[key] || '',
        }),
      },
    });

    expect(getDrivePickerConfig()).toEqual(
      expect.objectContaining({
        appId: 'picker-app-id',
        authorizationStatus: 'ready',
        developerKey: 'dev-key',
        origin: 'https://docs.google.com',
        pickerEnabled: true,
        token: 'token-123',
      })
    );
  });
});
