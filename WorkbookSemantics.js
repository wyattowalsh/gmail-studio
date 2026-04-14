const WORKBOOK_SEMANTIC_KEYS = Object.freeze({
  role: 'gs_role',
  zone: 'gs_zone',
});

const WORKBOOK_SEMANTIC_PREFIX = 'Gmail Studio | safeguard |';

const FALLBACK_SHEET_NAMES = Object.freeze({
  analytics: 'Analytics',
  compose: 'Compose',
  config: 'Config',
  outbound: 'Outbound',
  start: 'Start Here',
});

const FALLBACK_OUTBOUND_HEADER_ROW = 2;

const FALLBACK_OUTBOUND_ADVANCED_HEADERS = Object.freeze([
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

function refreshOperatorSafeguards(spreadsheet) {
  const ss = getActiveSpreadsheet_(spreadsheet);
  if (!ss) {
    return {
      metadataAnchors: 0,
      protections: 0,
    };
  }

  clearManagedDeveloperMetadata_(ss);
  removeManagedProtections_(ss);

  let metadataAnchors = 0;
  let protections = 0;

  const sheets = getSheetsByName_(ss);

  metadataAnchors += tagSheetRole_(sheets.start, 'start');
  metadataAnchors += tagSheetRole_(sheets.compose, 'compose');
  metadataAnchors += tagSheetRole_(sheets.outbound, 'outbound');
  metadataAnchors += tagSheetRole_(sheets.config, 'config');
  metadataAnchors += tagSheetRole_(sheets.analytics, 'analytics');

  metadataAnchors += tagStartHereZones_(sheets.start);
  metadataAnchors += tagComposeZones_(sheets.compose);
  metadataAnchors += tagConfigZones_(sheets.config);
  metadataAnchors += tagOutboundZones_(sheets.outbound);
  metadataAnchors += tagAnalyticsZones_(sheets.analytics);

  protections += addStartHereProtection_(sheets.start);
  protections += addComposeProtections_(sheets.compose);
  protections += addConfigProtections_(sheets.config);
  protections += addOutboundProtections_(sheets.outbound);
  protections += addAnalyticsProtection_(sheets.analytics);

  maybeToast_(ss, 'Operator safeguards refreshed.');

  return {
    metadataAnchors: metadataAnchors,
    protections: protections,
  };
}

function refreshQueueViews(spreadsheet) {
  const ss = getActiveSpreadsheet_(spreadsheet);
  const outboundSheet = ss && getSheetByName_(ss, getSheetNames_().outbound);

  if (!ss || !outboundSheet) {
    return {
      created: 0,
      removed: 0,
    };
  }

  const headers = getOutboundHeaders_(outboundSheet);
  const lastColumn = Math.max(headers.length, 1);
  const dataRange = outboundSheet.getRange(
    FALLBACK_OUTBOUND_HEADER_ROW,
    1,
    Math.max(outboundSheet.getMaxRows() - FALLBACK_OUTBOUND_HEADER_ROW + 1, 1),
    lastColumn
  );
  const slicerDefinitions = getQueueSlicerDefinitions_(headers, lastColumn);
  const removed = removeManagedSlicers_(outboundSheet);

  let created = 0;
  slicerDefinitions.forEach((definition) => {
    if (!definition) {
      return;
    }

    try {
      const slicer = outboundSheet.insertSlicer(dataRange, definition.anchorRow, definition.anchorColumn);

      if (typeof slicer.setTitle === 'function') {
        slicer.setTitle(definition.title);
      }
      if (typeof slicer.setBackgroundColor === 'function') {
        slicer.setBackgroundColor('#fcf8f1');
      }
      if (typeof slicer.setTitleHorizontalAlignment === 'function') {
        slicer.setTitleHorizontalAlignment('left');
      }
      if (
        typeof slicer.setColumnFilterCriteria === 'function' &&
        typeof SpreadsheetApp !== 'undefined' &&
        typeof SpreadsheetApp.newFilterCriteria === 'function'
      ) {
        try {
          const criteria = SpreadsheetApp.newFilterCriteria().build();
          slicer.setColumnFilterCriteria(definition.columnPosition, criteria);
        } catch (_) {
          // Slicer criteria creation is best-effort only.
        }
      }
      if (typeof slicer.setPosition === 'function') {
        slicer.setPosition(definition.anchorRow, definition.anchorColumn, 0, 0);
      }

      created += 1;
    } catch (_) {
      // Slicer support varies by sheet state and authorization. Keep this non-destructive.
    }
  });

  maybeToast_(ss, 'Outbound queue views refreshed.');

  return {
    created: created,
    removed: removed,
  };
}

function clearManagedDeveloperMetadata_(spreadsheet) {
  if (!spreadsheet || typeof spreadsheet.createDeveloperMetadataFinder !== 'function') {
    return;
  }

  [WORKBOOK_SEMANTIC_KEYS.role, WORKBOOK_SEMANTIC_KEYS.zone].forEach((key) => {
    try {
      spreadsheet
        .createDeveloperMetadataFinder()
        .withKey(key)
        .find()
        .forEach((metadata) => {
          if (metadata && typeof metadata.remove === 'function') {
            metadata.remove();
          }
        });
    } catch (_) {
      // Metadata may not exist yet or the spreadsheet may be partially initialized.
    }
  });
}

function removeManagedProtections_(spreadsheet) {
  const sheetNames = getSheetNames_();
  Object.keys(sheetNames).forEach((sheetKey) => {
    const sheet = getSheetByName_(spreadsheet, sheetNames[sheetKey]);
    if (!sheet || typeof sheet.getProtections !== 'function') {
      return;
    }

    const protectionTypes =
      typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.ProtectionType
        ? [SpreadsheetApp.ProtectionType.RANGE, SpreadsheetApp.ProtectionType.SHEET]
        : [];

    protectionTypes.forEach((type) => {
      const protections = (() => {
        try {
          return sheet.getProtections(type) || [];
        } catch (_) {
          return [];
        }
      })();

      protections.forEach((protection) => {
        const description = typeof protection.getDescription === 'function' ? protection.getDescription() : '';
        if (String(description || '').indexOf(WORKBOOK_SEMANTIC_PREFIX) !== 0) {
          return;
        }
        if (typeof protection.remove === 'function') {
          try {
            protection.remove();
          } catch (_) {
            // Keep going if the current user cannot remove an existing protection.
          }
        }
      });
    });
  });
}

function tagSheetRole_(sheet, role) {
  if (!sheet || typeof sheet.addDeveloperMetadata !== 'function') {
    return 0;
  }

  try {
    if (
      typeof SpreadsheetApp !== 'undefined' &&
      SpreadsheetApp.DeveloperMetadataVisibility &&
      SpreadsheetApp.DeveloperMetadataVisibility.PROJECT
    ) {
      sheet.addDeveloperMetadata(
        WORKBOOK_SEMANTIC_KEYS.role,
        String(role || ''),
        SpreadsheetApp.DeveloperMetadataVisibility.PROJECT
      );
    } else {
      sheet.addDeveloperMetadata(WORKBOOK_SEMANTIC_KEYS.role, String(role || ''));
    }
    return 1;
  } catch (_) {
    return 0;
  }
}

function tagZone_(range, zone) {
  if (!range || typeof range.addDeveloperMetadata !== 'function') {
    return 0;
  }

  try {
    if (
      typeof SpreadsheetApp !== 'undefined' &&
      SpreadsheetApp.DeveloperMetadataVisibility &&
      SpreadsheetApp.DeveloperMetadataVisibility.PROJECT
    ) {
      range.addDeveloperMetadata(
        WORKBOOK_SEMANTIC_KEYS.zone,
        String(zone || ''),
        SpreadsheetApp.DeveloperMetadataVisibility.PROJECT
      );
    } else {
      range.addDeveloperMetadata(WORKBOOK_SEMANTIC_KEYS.zone, String(zone || ''));
    }
    return 1;
  } catch (_) {
    return 0;
  }
}

function tagStartHereZones_(sheet) {
  if (!sheet) {
    return 0;
  }

  const ranges = [
    ['hero', 2, 2, 3, 6],
    ['workflow', 6, 2, 3, 6],
    ['quick_links', 10, 2, 7, 6],
    ['live_status', 18, 2, 7, 3],
    ['defaults', 18, 5, 7, 3],
    ['footer', 25, 2, 2, 6],
  ];

  return ranges.reduce((count, entry) => {
    try {
      return count + tagZone_(sheet.getRange(entry[1], entry[2], entry[3], entry[4]), entry[0]);
    } catch (_) {
      return count;
    }
  }, 0);
}

function tagComposeZones_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const valueRange = lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1) : null;

  return [
    tagZone_(sheet.getRange(1, 1, 1, 2), 'title_row'),
    tagZone_(sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1), 'labels'),
    valueRange ? tagZone_(valueRange, 'values') : 0,
  ].reduce((total, value) => total + value, 0);
}

function tagConfigZones_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  return [
    tagZone_(sheet.getRange(1, 1, 1, 3), 'title_row'),
    tagZone_(sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1), 'labels'),
    tagZone_(sheet.getRange(2, 2, Math.max(lastRow - 1, 1), 1), 'values'),
    tagZone_(sheet.getRange(2, 3, Math.max(lastRow - 1, 1), 1), 'descriptions'),
  ].reduce((total, value) => total + value, 0);
}

function tagOutboundZones_(sheet) {
  if (!sheet) {
    return 0;
  }

  const headers = getOutboundHeaders_(sheet);
  const lastColumn = Math.max(headers.length, 1);
  const lastRow = Math.max(sheet.getLastRow(), FALLBACK_OUTBOUND_HEADER_ROW);
  const statusColumn = headers.indexOf('status') + 1;
  const advancedRanges = contiguousRanges_(
    headers
      .map((header, index) => ({ header: header, index: index + 1 }))
      .filter((entry) => getAdvancedOutboundHeaders_().indexOf(entry.header) !== -1)
      .map((entry) => entry.index)
  );

  let count = 0;
  count += tagZone_(sheet.getRange(1, 1, 1, lastColumn), 'title_row');
  count += tagZone_(sheet.getRange(FALLBACK_OUTBOUND_HEADER_ROW, 1, 1, lastColumn), 'header_row');
  count += tagZone_(
    sheet.getRange(
      FALLBACK_OUTBOUND_HEADER_ROW + 1,
      1,
      Math.max(lastRow - FALLBACK_OUTBOUND_HEADER_ROW, 1),
      Math.min(4, lastColumn)
    ),
    'core_visible'
  );
  count += tagZone_(
    statusColumn > 0
      ? sheet.getRange(
          FALLBACK_OUTBOUND_HEADER_ROW + 1,
          statusColumn,
          Math.max(lastRow - FALLBACK_OUTBOUND_HEADER_ROW, 1),
          1
        )
      : null,
    'status_column'
  );

  advancedRanges.forEach((range) => {
    try {
      count += tagZone_(
        sheet.getRange(
          FALLBACK_OUTBOUND_HEADER_ROW,
          range.start,
          Math.max(lastRow - FALLBACK_OUTBOUND_HEADER_ROW + 1, 1),
          range.length
        ),
        'advanced_group'
      );
    } catch (_) {
      // Continue tagging the remaining ranges.
    }
  });

  count += tagZone_(
    sheet.getRange(
      FALLBACK_OUTBOUND_HEADER_ROW + 1,
      1,
      Math.max(lastRow - FALLBACK_OUTBOUND_HEADER_ROW, 1),
      lastColumn
    ),
    'data_start'
  );

  return count;
}

function tagAnalyticsZones_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastColumn = Math.max(sheet.getLastColumn(), 4);
  return [
    tagZone_(sheet.getRange(1, 1, 1, lastColumn), 'header_row'),
    tagZone_(sheet.getRange(2, 1, Math.max(lastRow - 1, 1), lastColumn), 'raw_log'),
  ].reduce((total, value) => total + value, 0);
}

function addStartHereProtection_(sheet) {
  return addManagedProtection_(
    sheet,
    sheet && typeof sheet.protect === 'function' ? sheet.protect() : null,
    'Start Here sheet'
  );
}

function addComposeProtections_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const protections = [
    protectRange_(sheet, sheet.getRange(1, 1, 1, 2), 'Compose headers'),
    protectRange_(sheet, sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1), 'Compose labels'),
  ];

  return protections.reduce((total, value) => total + value, 0);
}

function addConfigProtections_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastRow = Math.max(sheet.getLastRow(), 1);
  const protections = [
    protectRange_(sheet, sheet.getRange(1, 1, 1, 3), 'Config headers'),
    protectRange_(sheet, sheet.getRange(2, 1, Math.max(lastRow - 1, 1), 1), 'Config labels'),
    protectRange_(sheet, sheet.getRange(2, 3, Math.max(lastRow - 1, 1), 1), 'Config descriptions'),
  ];

  return protections.reduce((total, value) => total + value, 0);
}

function addOutboundProtections_(sheet) {
  if (!sheet) {
    return 0;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  return protectRange_(
    sheet,
    sheet.getRange(1, 1, Math.max(FALLBACK_OUTBOUND_HEADER_ROW, 1), lastColumn),
    'Outbound system rows'
  );
}

function addAnalyticsProtection_(sheet) {
  if (!sheet || typeof sheet.protect !== 'function') {
    return 0;
  }

  const protection = sheet.protect();
  return addManagedProtection_(sheet, protection, 'Analytics log');
}

function protectRange_(sheet, range, description) {
  if (!sheet || !range || typeof range.protect !== 'function') {
    return 0;
  }

  const protection = range.protect();
  return addManagedProtection_(sheet, protection, description);
}

function addManagedProtection_(sheet, protection, description) {
  if (!protection) {
    return 0;
  }

  try {
    if (typeof protection.setDescription === 'function') {
      protection.setDescription(`${WORKBOOK_SEMANTIC_PREFIX} ${description}`);
    }
    if (typeof protection.setWarningOnly === 'function') {
      protection.setWarningOnly(true);
    }
    if (typeof protection.canDomainEdit === 'function' && protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
    return 1;
  } catch (_) {
    return 0;
  }
}

function removeManagedSlicers_(sheet) {
  if (!sheet || typeof sheet.getSlicers !== 'function') {
    return 0;
  }

  let removed = 0;
  try {
    sheet.getSlicers().forEach((slicer) => {
      const title = typeof slicer.getTitle === 'function' ? slicer.getTitle() : '';
      if (!String(title || '').startsWith('Gmail Studio ::')) {
        return;
      }
      if (typeof slicer.remove === 'function') {
        try {
          slicer.remove();
          removed += 1;
        } catch (_) {
          // Keep the helper non-destructive.
        }
      }
    });
  } catch (_) {
    return removed;
  }

  return removed;
}

function getQueueSlicerDefinitions_(headers, lastColumn) {
  const columns = headers || [];
  const definitions = [
    { column: 'status', title: 'Gmail Studio :: Status', anchorRow: 3 },
    { column: 'template_name', title: 'Gmail Studio :: Template', anchorRow: 12 },
    { column: 'delivery_mode', title: 'Gmail Studio :: Delivery', anchorRow: 21 },
  ];

  return definitions.reduce((items, definition) => {
    const columnPosition = columns.indexOf(definition.column) + 1;
    if (!columnPosition) {
      return items;
    }

    items.push({
      anchorColumn: lastColumn + 2,
      anchorRow: definition.anchorRow,
      columnPosition: columnPosition,
      title: definition.title,
    });

    return items;
  }, []);
}

function getSheetByName_(spreadsheet, sheetName) {
  if (!spreadsheet || typeof spreadsheet.getSheetByName !== 'function') {
    return null;
  }

  try {
    return spreadsheet.getSheetByName(sheetName);
  } catch (_) {
    return null;
  }
}

function getSheetsByName_(spreadsheet) {
  const sheetNames = getSheetNames_();
  return Object.keys(sheetNames).reduce((accumulator, key) => {
    accumulator[key] = getSheetByName_(spreadsheet, sheetNames[key]);
    return accumulator;
  }, {});
}

function getSheetNames_() {
  if (typeof SHEET_NAMES !== 'undefined') {
    return SHEET_NAMES;
  }

  return FALLBACK_SHEET_NAMES;
}

function getOutboundHeaders_(sheet) {
  const headers = typeof getOutboundHeaders === 'function' ? getOutboundHeaders() : [];
  const lastColumn = Math.max(
    sheet && typeof sheet.getLastColumn === 'function' ? sheet.getLastColumn() : 0,
    headers.length,
    1
  );

  try {
    const rowValues = sheet.getRange(FALLBACK_OUTBOUND_HEADER_ROW, 1, 1, lastColumn).getValues()[0];
    return rowValues.map((value, index) => String(value || headers[index] || '').trim()).filter(Boolean);
  } catch (_) {
    return headers.length ? headers : [];
  }
}

function getAdvancedOutboundHeaders_() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.getAdvancedOutboundHeaders === 'function') {
    return globalThis.getAdvancedOutboundHeaders();
  }

  if (typeof require === 'function') {
    try {
      const workbookStyle = require('./WorkbookStyle');
      if (workbookStyle && typeof workbookStyle.getAdvancedOutboundHeaders === 'function') {
        return workbookStyle.getAdvancedOutboundHeaders();
      }
    } catch (_) {
      // Fall through to the local fallback list when the shared helper is unavailable.
    }
  }

  return FALLBACK_OUTBOUND_ADVANCED_HEADERS.slice();
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

function getActiveSpreadsheet_(spreadsheet) {
  if (spreadsheet) {
    return spreadsheet;
  }

  if (typeof SpreadsheetApp === 'undefined' || typeof SpreadsheetApp.getActiveSpreadsheet !== 'function') {
    return null;
  }

  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (_) {
    return null;
  }
}

function maybeToast_(spreadsheet, message) {
  if (!spreadsheet || typeof spreadsheet.toast !== 'function') {
    return;
  }

  try {
    spreadsheet.toast(String(message || ''), 'Gmail Studio');
  } catch (_) {
    // Toasts are best-effort only.
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    WORKBOOK_SEMANTIC_KEYS,
    WORKBOOK_SEMANTIC_PREFIX,
    contiguousRanges_,
    getQueueSlicerDefinitions_,
    refreshOperatorSafeguards,
    refreshQueueViews,
  };
}
