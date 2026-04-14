export interface AnalyticsSummary {
  clicks: number;
  opens: number;
  total: number;
}

export interface AnalyticsTrend {
  clicks: number;
  date: string;
  opens: number;
}

export interface QuotaForecast {
  draft_ready_now: number;
  is_at_risk: boolean;
  remaining: number;
  scheduled_future: number;
  send_ready_now: number;
  unsent_total: number;
}

export type DrivePickerAuthorizationStatus =
  | 'disabled'
  | 'missing_runtime'
  | 'missing_scopes'
  | 'needs_authorization'
  | 'ready'
  | 'unknown';

export interface DrivePickerConfig {
  developerKey: string;
  authorizationStatus: DrivePickerAuthorizationStatus;
  helpText: string;
  pickerEnabled: boolean;
  token: string;
  appId?: string;
  missingScopes?: string[];
  origin?: string;
}

export interface TemplateCatalogItem {
  default: boolean;
  description: string;
  family: 'broadcast' | 'personal';
  id: string;
  label: string;
  picker: boolean;
  rank: number;
  status: 'active' | 'broadcast' | 'legacy' | 'secondary';
  useCase: string;
}

export interface DraftMutationResult {
  draftId?: string;
}

export interface SendMutationResult {
  messageId?: string;
}

export interface BatchMutationResult {
  draftId?: string;
  error?: string;
  messageId?: string;
  rowNumber?: number;
  status?: string;
}

export interface AppsScriptMethodMap {
  createComposeDraft: {
    args: [];
    return: DraftMutationResult;
  };
  createScheduledDraftBatch: {
    args: [];
    return: BatchMutationResult[];
  };
  getAnalyticsSummary: {
    args: [];
    return: AnalyticsSummary;
  };
  getAnalyticsTrends: {
    args: [];
    return: AnalyticsTrend[];
  };
  getDrivePickerConfig: {
    args: [];
    return: DrivePickerConfig;
  };
  getTemplateCatalogForUi: {
    args: [];
    return: TemplateCatalogItem[];
  };
  getPreviewHtml: {
    args: [];
    return: string;
  };
  getQuotaForecast: {
    args: [];
    return: QuotaForecast;
  };
  sendComposeDraft: {
    args: [];
    return: SendMutationResult;
  };
  sendScheduledBatch: {
    args: [];
    return: BatchMutationResult[];
  };
  sendUnsentBatch: {
    args: [];
    return: BatchMutationResult[];
  };
  updateActiveCellWithFile: {
    args: [fileId: string];
    return: void;
  };
}

export interface ActionFeedItem {
  detail?: string;
  id: string;
  label: string;
  status: 'error' | 'pending' | 'success';
}
