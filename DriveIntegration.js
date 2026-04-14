/**
 * Returns configuration for the Google Picker.
 */
function getDrivePickerConfig() {
  const pickerProperties = getPickerProperties_();
  const authorizationInfo = getPickerAuthorizationInfo_();
  const authorizationStatus = resolvePickerAuthorizationStatus_(pickerProperties, authorizationInfo);
  const pickerEnabled =
    authorizationStatus === 'ready' && pickerProperties.developerKey.length > 0 && pickerProperties.token.length > 0;
  const missingScopes =
    authorizationStatus === 'needs_authorization' || authorizationStatus === 'missing_scopes'
      ? ['https://www.googleapis.com/auth/drive.readonly']
      : undefined;

  return {
    developerKey: pickerProperties.developerKey,
    token: pickerProperties.token,
    pickerEnabled: pickerEnabled,
    authorizationStatus: authorizationStatus,
    helpText: buildPickerHelpText_(authorizationStatus, pickerProperties),
    origin: pickerProperties.origin || undefined,
    appId: pickerProperties.appId || undefined,
    missingScopes: missingScopes,
  };
}

/**
 * Updates the active cell with the selected file ID.
 */
function updateActiveCellWithFile(fileId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cell = ss.getActiveCell();
  const currentVal = cell.getValue();

  if (currentVal) {
    cell.setValue(currentVal + ', ' + fileId);
  } else {
    cell.setValue(fileId);
  }

  ss.toast('Attachment ID added to cell.', 'Gmail Studio');
}

function getPickerProperties_() {
  const scriptProperties =
    typeof PropertiesService !== 'undefined' && PropertiesService.getScriptProperties
      ? PropertiesService.getScriptProperties()
      : null;

  return {
    appId: readPickerProperty_(scriptProperties, ['PICKER_APP_ID', 'GOOGLE_PICKER_APP_ID']),
    developerKey: readPickerProperty_(scriptProperties, ['PICKER_DEVELOPER_KEY', 'GOOGLE_PICKER_DEVELOPER_KEY']),
    origin: readPickerProperty_(scriptProperties, ['PICKER_ORIGIN', 'GOOGLE_PICKER_ORIGIN']),
    token: readPickerOAuthToken_(),
  };
}

function readPickerProperty_(scriptProperties, keys) {
  if (!scriptProperties || typeof scriptProperties.getProperty !== 'function') {
    return '';
  }

  for (let i = 0; i < keys.length; i += 1) {
    const value = scriptProperties.getProperty(keys[i]);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function readPickerOAuthToken_() {
  try {
    return typeof ScriptApp !== 'undefined' && typeof ScriptApp.getOAuthToken === 'function'
      ? String(ScriptApp.getOAuthToken() || '')
      : '';
  } catch (_) {
    return '';
  }
}

function getPickerAuthorizationInfo_() {
  if (
    typeof ScriptApp === 'undefined' ||
    typeof ScriptApp.getAuthorizationInfo !== 'function' ||
    !ScriptApp.AuthMode ||
    !ScriptApp.AuthMode.FULL
  ) {
    return null;
  }

  try {
    return ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  } catch (_) {
    return null;
  }
}

function resolvePickerAuthorizationStatus_(pickerProperties, authorizationInfo) {
  if (
    authorizationInfo &&
    typeof authorizationInfo.getAuthorizationStatus === 'function' &&
    typeof ScriptApp !== 'undefined' &&
    ScriptApp.AuthorizationStatus
  ) {
    try {
      const status = authorizationInfo.getAuthorizationStatus();

      if (status === ScriptApp.AuthorizationStatus.REQUIRED) {
        return 'needs_authorization';
      }

      if (status === ScriptApp.AuthorizationStatus.NOT_REQUIRED) {
        return hasPickerConfiguration_(pickerProperties) ? 'ready' : 'disabled';
      }
    } catch (_) {
      return hasPickerConfiguration_(pickerProperties) ? 'unknown' : 'disabled';
    }
  }

  return hasPickerConfiguration_(pickerProperties) ? 'unknown' : 'disabled';
}

function hasPickerConfiguration_(pickerProperties) {
  return (
    String(pickerProperties.developerKey || '').trim().length > 0 &&
    String(pickerProperties.token || '').trim().length > 0
  );
}

function buildPickerHelpText_(authorizationStatus, pickerProperties) {
  if (authorizationStatus === 'ready') {
    return 'Drive attachments are ready.';
  }

  if (authorizationStatus === 'needs_authorization') {
    return 'Authorize Gmail Studio to use Drive attachments, then reopen the sidebar.';
  }

  if (authorizationStatus === 'disabled') {
    if (!pickerProperties.developerKey && !pickerProperties.appId && !pickerProperties.origin) {
      return 'Add Picker configuration in Script Properties to enable Drive attachments.';
    }

    if (!pickerProperties.developerKey) {
      return 'Add a Picker developer key in Script Properties to enable Drive attachments.';
    }

    if (!pickerProperties.token) {
      return 'Open this spreadsheet in Apps Script and authorize Gmail Studio to attach Drive files.';
    }
  }

  return 'Drive attachment readiness could not be confirmed.';
}

if (typeof module !== 'undefined') {
  module.exports = {
    getDrivePickerConfig,
    updateActiveCellWithFile,
  };
}
