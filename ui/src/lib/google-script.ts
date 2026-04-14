import type {
  AnalyticsSummary,
  AnalyticsTrend,
  AppsScriptMethodMap,
  BatchMutationResult,
  DraftMutationResult,
  DrivePickerConfig,
  QuotaForecast,
  TemplateCatalogItem,
} from '@/lib/types';

type MethodName = keyof AppsScriptMethodMap;

const defaultDrivePickerHelpText = 'Drive attachments are ready once the sidebar can reach Google Picker.';

const mockTrends: AnalyticsTrend[] = [
  { clicks: 2, date: '2026-04-07', opens: 10 },
  { clicks: 5, date: '2026-04-08', opens: 15 },
  { clicks: 1, date: '2026-04-09', opens: 8 },
  { clicks: 8, date: '2026-04-10', opens: 20 },
  { clicks: 12, date: '2026-04-11', opens: 25 },
  { clicks: 6, date: '2026-04-12', opens: 18 },
  { clicks: 8, date: '2026-04-13', opens: 28 },
];

const mockPreviewHtml = `
  <html>
    <body style="margin:0;padding:28px;background:linear-gradient(180deg,#f7f0e6 0%,#f2eadf 100%);color:#2a211c;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;border:1px solid #e1d4c4;border-radius:24px;background:#fffdf8;box-shadow:0 20px 50px rgba(85,58,33,0.08);overflow:hidden;">
        <div style="padding:24px 28px 12px;">
          <span style="display:inline-flex;align-items:center;border:1px solid #d2c2b1;border-radius:999px;padding:5px 10px;font-size:11px;line-height:1;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a5d3b;background:#f9f3eb;">Warm Premium Preview</span>
          <h1 style="margin:16px 0 10px;font-size:30px;line-height:1.05;letter-spacing:-0.04em;font-weight:700;">A thoughtful note with room to breathe</h1>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#5d5047;">This mock preview mirrors the active compose row with a calmer, more premium frame for quick inspection.</p>
        </div>
        <div style="padding:0 28px 24px;">
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:8px 0 18px;">
            <div style="border:1px solid #e5d7c7;border-radius:16px;padding:12px;background:#faf5ee;">
              <div style="font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.12em;color:#8d7766;">Tone</div>
              <div style="margin-top:6px;font-size:13px;font-weight:600;color:#2a211c;">Warm, direct</div>
            </div>
            <div style="border:1px solid #e5d7c7;border-radius:16px;padding:12px;background:#faf5ee;">
              <div style="font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.12em;color:#8d7766;">Format</div>
              <div style="margin-top:6px;font-size:13px;font-weight:600;color:#2a211c;">Responsive preview</div>
            </div>
            <div style="border:1px solid #e5d7c7;border-radius:16px;padding:12px;background:#faf5ee;">
              <div style="font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.12em;color:#8d7766;">State</div>
              <div style="margin-top:6px;font-size:13px;font-weight:600;color:#2a211c;">Mock data</div>
            </div>
          </div>
          <div style="border:1px solid #e7dbcb;border-radius:20px;padding:18px;background:linear-gradient(180deg,#fffaf4 0%,#fff 100%);">
            <p style="margin:0 0 10px;font-size:11px;line-height:1;text-transform:uppercase;letter-spacing:.14em;color:#9a7d65;">Preview body</p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#41352d;">The copy should feel calm, intentional, and easy to scan. Use this frame to confirm spacing, hierarchy, and CTA treatment before drafting or sending.</p>
            <a href="#" style="display:inline-flex;align-items:center;border-radius:999px;border:1px solid #7d5d47;background:#7d5d47;color:#fff;padding:11px 16px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Primary action</a>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

const mockTemplateCatalog: TemplateCatalogItem[] = [
  {
    default: true,
    description: 'Warm one-to-one note with the gentlest layout and the clearest reading rhythm.',
    family: 'personal',
    id: 'TemplatePersonalNote',
    label: 'Personal Note',
    picker: true,
    rank: 1,
    status: 'active',
    useCase: 'Best default for thoughtful one-to-one outreach that should feel hand-written.',
  },
  {
    default: false,
    description: 'High-contrast personal option with more editorial edge and deliberate spacing.',
    family: 'personal',
    id: 'TemplateBrutalist',
    label: 'Brutalist',
    picker: true,
    rank: 2,
    status: 'active',
    useCase: 'Use when you want the strongest visual frame without changing the message contract.',
  },
  {
    default: false,
    description: 'Quiet, stripped-back personal format that keeps the copy at center stage.',
    family: 'personal',
    id: 'TemplateMinimal',
    label: 'Minimal',
    picker: true,
    rank: 3,
    status: 'active',
    useCase: 'Best when the message should stay low-friction and almost invisible.',
  },
  {
    default: false,
    description: 'Sharper polished frame for personal sends that need a little more finish.',
    family: 'personal',
    id: 'TemplateClean',
    label: 'Clean',
    picker: true,
    rank: 4,
    status: 'secondary',
    useCase: 'Polished fallback when you want a calmer frame with a finished look.',
  },
  {
    default: false,
    description: 'Broadcast layout for launches, updates, and announcements with a calmer finish.',
    family: 'broadcast',
    id: 'TemplateNewsletter',
    label: 'Newsletter',
    picker: true,
    rank: 6,
    status: 'broadcast',
    useCase: 'Use for recurring updates, launches, and any message that behaves like a broadcast.',
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  return items.length > 0 ? items : undefined;
}

function normalizeDrivePickerAuthorizationStatus(value: unknown) {
  if (
    value === 'disabled' ||
    value === 'missing_runtime' ||
    value === 'missing_scopes' ||
    value === 'needs_authorization' ||
    value === 'ready'
  ) {
    return value;
  }

  return 'unknown' as const;
}

function normalizeDrivePickerConfig(rawConfig: unknown): DrivePickerConfig {
  const raw = isRecord(rawConfig) ? rawConfig : {};
  const developerKey = typeof raw.developerKey === 'string' ? raw.developerKey : '';
  const token = typeof raw.token === 'string' ? raw.token : '';
  const explicitEnabled = typeof raw.pickerEnabled === 'boolean' ? raw.pickerEnabled : undefined;
  const authorizationStatus = normalizeDrivePickerAuthorizationStatus(raw.authorizationStatus);
  const hasCoreSecrets = developerKey.trim().length > 0 && token.trim().length > 0;
  const pickerEnabled = explicitEnabled ?? (hasCoreSecrets && authorizationStatus !== 'disabled');
  const helpText =
    typeof raw.helpText === 'string' && raw.helpText.trim().length > 0
      ? raw.helpText
      : pickerEnabled
        ? defaultDrivePickerHelpText
        : 'Drive attachments are paused until the picker is enabled for this workspace.';

  return {
    developerKey,
    token,
    pickerEnabled,
    authorizationStatus: pickerEnabled ? 'ready' : authorizationStatus,
    helpText,
    appId: typeof raw.appId === 'string' && raw.appId.trim().length > 0 ? raw.appId : undefined,
    missingScopes: toStringArray(raw.missingScopes),
    origin: typeof raw.origin === 'string' && raw.origin.trim().length > 0 ? raw.origin : undefined,
  };
}

export function describeDrivePickerConfig(config: DrivePickerConfig | null | undefined, runtimeAvailable: boolean) {
  if (!runtimeAvailable) {
    return {
      canOpen: false,
      description:
        config?.helpText ??
        'Open this sidebar from the bound spreadsheet to use Drive attachments. Local preview cannot launch Google Picker.',
      missingScopes: config?.missingScopes ?? [],
      tone: 'warning' as const,
      title: 'Open in Apps Script',
    };
  }

  if (!config) {
    return {
      canOpen: false,
      description:
        'Drive attachment settings have not loaded yet. Recheck access once the Apps Script bridge is available.',
      missingScopes: [],
      tone: 'info' as const,
      title: 'Checking Drive Access',
    };
  }

  if (!config.pickerEnabled) {
    const scopeSuffix = config.missingScopes?.length ? ` Missing scopes: ${config.missingScopes.join(', ')}.` : '';

    return {
      canOpen: false,
      description: `${config.helpText}${scopeSuffix}`.trim(),
      missingScopes: config.missingScopes ?? [],
      tone: config.authorizationStatus === 'disabled' ? ('info' as const) : ('warning' as const),
      title:
        config.authorizationStatus === 'disabled'
          ? 'Drive Attachments Paused'
          : 'Drive Access Needs Attention',
    };
  }

  return {
    canOpen: true,
    description: config.helpText || defaultDrivePickerHelpText,
    missingScopes: config.missingScopes ?? [],
    tone: 'success' as const,
    title: 'Drive Attachments Ready',
  };
}

function delay<T>(value: T, timeout = 250): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), timeout);
  });
}

function getMockResult<K extends MethodName>(method: K): Promise<AppsScriptMethodMap[K]['return']> {
  switch (method) {
    case 'createComposeDraft':
      return delay({ draftId: 'mock-draft-001' } as AppsScriptMethodMap[K]['return']);
    case 'createScheduledDraftBatch':
      return delay([{ status: 'DRAFTED' }] as AppsScriptMethodMap[K]['return']);
    case 'getAnalyticsSummary': {
      const summary: AnalyticsSummary = { clicks: 42, opens: 124, total: 200 };
      return delay(summary as AppsScriptMethodMap[K]['return']);
    }
    case 'getAnalyticsTrends':
      return delay(mockTrends as AppsScriptMethodMap[K]['return']);
    case 'getDrivePickerConfig': {
      const config: DrivePickerConfig = normalizeDrivePickerConfig({
        authorizationStatus: 'ready',
        developerKey: 'mock-developer-key',
        helpText: 'Drive attachments are ready in this preview.',
        origin: window.location.origin,
        pickerEnabled: true,
        token: 'mock-token',
      });
      return delay(config as AppsScriptMethodMap[K]['return']);
    }
    case 'getTemplateCatalogForUi':
      return delay(mockTemplateCatalog as AppsScriptMethodMap[K]['return']);
    case 'getPreviewHtml':
      return delay(mockPreviewHtml as AppsScriptMethodMap[K]['return']);
    case 'getQuotaForecast': {
      const forecast: QuotaForecast = {
        draft_ready_now: 7,
        is_at_risk: false,
        remaining: 138,
        scheduled_future: 11,
        send_ready_now: 14,
        unsent_total: 23,
      };
      return delay(forecast as AppsScriptMethodMap[K]['return']);
    }
    case 'sendComposeDraft':
      return delay({ messageId: 'mock-message-001' } as AppsScriptMethodMap[K]['return']);
    case 'sendScheduledBatch':
    case 'sendUnsentBatch': {
      const result: BatchMutationResult[] = [{ status: 'SENT' }, { status: 'SENT' }];
      return delay(result as AppsScriptMethodMap[K]['return']);
    }
    case 'updateActiveCellWithFile':
      return delay(undefined as AppsScriptMethodMap[K]['return']);
    default:
      throw new Error(`No mock result configured for ${String(method)}`);
  }
}

function getRunner() {
  return window.google?.script?.run;
}

export function hasGoogleScriptRuntime() {
  return Boolean(getRunner());
}

export function getErrorMessage(caughtError: unknown) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  if (typeof caughtError === 'string') {
    return caughtError;
  }

  return 'Unknown Apps Script error';
}

export function callGoogleScript<K extends MethodName>(
  method: K,
  ...args: AppsScriptMethodMap[K]['args']
): Promise<AppsScriptMethodMap[K]['return']> {
  const runner = getRunner();

  if (!runner) {
    return getMockResult(method);
  }

  return new Promise((resolve, reject) => {
    const typedRunner = runner
      .withSuccessHandler((result: AppsScriptMethodMap[K]['return']) => resolve(result))
      .withFailureHandler((caughtError: unknown) => reject(caughtError)) as Record<string, unknown>;

    const target = typedRunner[method];

    if (typeof target !== 'function') {
      reject(new Error(`Apps Script method ${String(method)} is not available.`));
      return;
    }

    (target as (...callArgs: AppsScriptMethodMap[K]['args']) => void)(...args);
  });
}

export const gmailStudioClient = {
  createComposeDraft: () => callGoogleScript('createComposeDraft'),
  createScheduledDraftBatch: () => callGoogleScript('createScheduledDraftBatch'),
  getAnalyticsSummary: () => callGoogleScript('getAnalyticsSummary'),
  getAnalyticsTrends: () => callGoogleScript('getAnalyticsTrends'),
  getDrivePickerConfig: async () => normalizeDrivePickerConfig(await callGoogleScript('getDrivePickerConfig')),
  getTemplateCatalogForUi: () => callGoogleScript('getTemplateCatalogForUi'),
  getPreviewHtml: () => callGoogleScript('getPreviewHtml'),
  getQuotaForecast: () => callGoogleScript('getQuotaForecast'),
  sendComposeDraft: () => callGoogleScript('sendComposeDraft'),
  sendScheduledBatch: () => callGoogleScript('sendScheduledBatch'),
  sendUnsentBatch: () => callGoogleScript('sendUnsentBatch'),
  updateActiveCellWithFile: (fileId: string) => callGoogleScript('updateActiveCellWithFile', fileId),
} as const;

export type GmailStudioClient = typeof gmailStudioClient;

export type { DraftMutationResult };
