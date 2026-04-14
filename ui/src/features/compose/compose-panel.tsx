import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { Eye, MailPlus, Paperclip, Send, Smartphone, Monitor } from 'lucide-react';

import { ActionFeed } from '@/components/sidebar/action-feed';
import { PanelMessage } from '@/components/sidebar/panel-message';
import { StatusBadge } from '@/components/sidebar/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  describeDrivePickerConfig,
  gmailStudioClient,
  getErrorMessage,
  hasGoogleScriptRuntime,
} from '@/lib/google-script';
import type { ActionFeedItem, DrivePickerConfig, TemplateCatalogItem } from '@/lib/types';
import { cn } from '@/lib/utils';

type PreviewMode = 'desktop' | 'mobile';
type ComposeMutation = 'draft' | 'send';

export function ComposePanel() {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [templateCatalog, setTemplateCatalog] = useState<TemplateCatalogItem[]>([]);
  const [drivePickerConfig, setDrivePickerConfig] = useState<DrivePickerConfig | null>(null);
  const [drivePickerLoading, setDrivePickerLoading] = useState(true);
  const [confirmedActions, setConfirmedActions] = useState<ActionFeedItem[]>([]);
  const [optimisticActions, addOptimisticAction] = useOptimistic(
    confirmedActions,
    (currentState, nextAction: ActionFeedItem) => [nextAction, ...currentState].slice(0, 3)
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void gmailStudioClient
      .getTemplateCatalogForUi()
      .then((result) => setTemplateCatalog(result.filter((template) => template.picker)))
      .catch(() => setTemplateCatalog([]));
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDrivePickerConfig = async () => {
      setDrivePickerLoading(true);

      try {
        const config = await gmailStudioClient.getDrivePickerConfig();

        if (isActive) {
          setDrivePickerConfig(config);
        }
      } catch {
        if (isActive) {
          setDrivePickerConfig({
            authorizationStatus: 'unknown',
            developerKey: '',
            helpText: 'Drive attachments are paused until Apps Script returns picker settings.',
            pickerEnabled: false,
            token: '',
          });
        }
      } finally {
        if (isActive) {
          setDrivePickerLoading(false);
        }
      }
    };

    void loadDrivePickerConfig();

    return () => {
      isActive = false;
    };
  }, []);

  const featuredTemplates = [...templateCatalog]
    .sort((left, right) => left.rank - right.rank || Number(right.default) - Number(left.default))
    .slice(0, 3);
  const pickerReadiness = describeDrivePickerConfig(drivePickerConfig, hasGoogleScriptRuntime());

  const loadPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const html = await gmailStudioClient.getPreviewHtml();
      setPreviewHtml(html);
    } catch (caughtError) {
      setPreviewError(getErrorMessage(caughtError));
    } finally {
      setPreviewLoading(false);
    }
  };

  const pushConfirmedAction = (nextAction: ActionFeedItem) => {
    setConfirmedActions((currentState) => [nextAction, ...currentState].slice(0, 3));
  };

  const runComposeMutation = (mutation: ComposeMutation) => {
    const actionId = crypto.randomUUID();
    const label = mutation === 'draft' ? 'Build Gmail Draft' : 'Send Now';

    addOptimisticAction({
      id: actionId,
      label,
      detail:
        mutation === 'draft'
          ? 'Building a Gmail draft from the active compose row.'
          : 'Sending the active compose row immediately.',
      status: 'pending',
    });

    startTransition(() => {
      void (async () => {
        try {
          if (mutation === 'draft') {
            const result = await gmailStudioClient.createComposeDraft();
            pushConfirmedAction({
              id: actionId,
              label,
              detail: result.draftId ? `Draft created: ${result.draftId}` : 'Draft created successfully.',
              status: 'success',
            });
            return;
          }

          await gmailStudioClient.sendComposeDraft();
          pushConfirmedAction({
            id: actionId,
            label,
            detail: 'Compose row sent successfully.',
            status: 'success',
          });
        } catch (caughtError) {
          pushConfirmedAction({
            id: actionId,
            label,
            detail: getErrorMessage(caughtError),
            status: 'error',
          });
        }
      })();
    });
  };

  const handlePickFile = async () => {
    if (!pickerReadiness.canOpen) {
      return;
    }

    const pickerHost = window as Window & {
      gapi?: { load(api: string, callback: () => void): void };
      google?: Window['google'];
    };

    try {
      const config = drivePickerConfig ?? (await gmailStudioClient.getDrivePickerConfig());
      const pickerNamespace = pickerHost.google?.picker;

      if (!pickerHost.gapi || !pickerNamespace) {
        throw new Error('Google Picker is unavailable in this sidebar session.');
      }

      pickerHost.gapi.load('picker', () => {
        const pickerBuilder = new pickerNamespace.PickerBuilder()
          .addView(pickerNamespace.ViewId.DOCS)
          .setOAuthToken(config.token)
          .setDeveloperKey(config.developerKey);
        const pickerBuilderWithOptionals = pickerBuilder as typeof pickerBuilder & {
          setAppId?: (appId: string) => typeof pickerBuilder;
          setOrigin?: (origin: string) => typeof pickerBuilder;
        };

        if (config.origin && typeof pickerBuilderWithOptionals.setOrigin === 'function') {
          pickerBuilderWithOptionals.setOrigin(config.origin);
        }

        if (config.appId && typeof pickerBuilderWithOptionals.setAppId === 'function') {
          pickerBuilderWithOptionals.setAppId(config.appId);
        }

        const picker = pickerBuilder.setCallback((data) => {
          const pickedDoc = data.docs[0];

          if (data.action !== pickerNamespace.Action.PICKED || !pickedDoc?.id) {
            return;
          }

          const fileId = pickedDoc.id;

          startTransition(() => {
            void (async () => {
              const actionId = crypto.randomUUID();

              addOptimisticAction({
                id: actionId,
                label: 'Attach Drive File',
                detail: 'Adding the selected Drive file id to the active sheet cell.',
                status: 'pending',
              });

              try {
                await gmailStudioClient.updateActiveCellWithFile(fileId);
                pushConfirmedAction({
                  id: actionId,
                  label: 'Attach Drive File',
                  detail: `Attached file id ${fileId}.`,
                  status: 'success',
                });
              } catch (caughtError) {
                pushConfirmedAction({
                  id: actionId,
                  label: 'Attach Drive File',
                  detail: getErrorMessage(caughtError),
                  status: 'error',
                });
              }
            })();
          });
        }).build();

        picker.setVisible(true);
      });
    } catch (caughtError) {
      pushConfirmedAction({
        id: crypto.randomUUID(),
        label: 'Attach Drive File',
        detail: getErrorMessage(caughtError),
        status: 'error',
      });
    }
  };

  return (
    <div className="space-y-3">
      <Card className="gap-4">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Compose Desk</CardTitle>
              <p className="mt-2 text-[11px] leading-snug text-[rgba(77,62,49,0.72)]">
                Preview the active compose row, attach files when Drive is ready, then draft or send with confidence.
              </p>
            </div>
            <StatusBadge tone="accent">Compose</StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="rounded-[18px] border border-[rgba(118,95,68,0.16)] bg-[rgba(250,243,233,0.92)] p-3">
            <StatusBadge tone="accent">Markdown Ready</StatusBadge>
            <p className="mt-2 text-[12px] leading-relaxed text-[rgba(77,62,49,0.72)]">
              Active compose rows can become polished Gmail drafts or immediate sends without leaving the sheet.
            </p>
          </div>

          {featuredTemplates.length > 0 ? (
            <div className="rounded-[18px] border border-[rgba(118,95,68,0.16)] bg-[rgba(255,252,247,0.88)] p-3">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge tone="neutral">Template Picks</StatusBadge>
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[rgba(77,62,49,0.56)]">
                  Personal family
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {featuredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[16px] border border-[rgba(118,95,68,0.12)] bg-[linear-gradient(180deg,rgba(255,253,249,0.96)_0%,rgba(248,242,233,0.96)_100%)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-semibold tracking-[-0.01em] text-[#2a211c]">{template.label}</div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#8a5d3b]">
                        {template.default ? 'recommended' : `${template.family} #${template.rank}`}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#5d5047]">{template.useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <PanelMessage
            description={
              drivePickerLoading
                ? 'Checking Drive access and attachment readiness for this workspace.'
                : pickerReadiness.description
            }
            title={drivePickerLoading ? 'Checking Drive Access' : pickerReadiness.title}
            tone={drivePickerLoading ? 'info' : pickerReadiness.tone}
          />

          {!hasGoogleScriptRuntime() ? (
            <PanelMessage
              description="Local preview uses mock Apps Script responses until the sidebar is opened inside a bound spreadsheet."
              title="Preview Mode"
              tone="warning"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-9 px-2 text-[11px]" onClick={() => void loadPreview()} disabled={previewLoading || isPending}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
            <Button variant="outline" className="h-9 px-2 text-[11px]" onClick={() => void handlePickFile()} disabled={drivePickerLoading || isPending || !pickerReadiness.canOpen}>
              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
              Attach Drive File
            </Button>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" className="h-10 justify-start px-3 text-[11px]" onClick={() => runComposeMutation('draft')} disabled={isPending}>
              <MailPlus className="mr-2 h-3.5 w-3.5" />
              {isPending ? 'Working...' : 'Build Gmail Draft'}
            </Button>
            <Button className="h-10 justify-start px-3 text-[11px]" onClick={() => runComposeMutation('send')} disabled={isPending}>
              <Send className="mr-2 h-3.5 w-3.5" />
              {isPending ? 'Working...' : 'Send Now'}
            </Button>
          </div>

          <ActionFeed items={optimisticActions} />
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Preview Frame</CardTitle>
              <p className="mt-2 text-[11px] leading-snug text-[rgba(77,62,49,0.72)]">
                Toggle between the narrow and full-width frame to spot hierarchy or spacing issues before you draft.
              </p>
            </div>
            <div className="flex overflow-hidden rounded-[14px] border border-[rgba(118,95,68,0.16)] bg-[rgba(247,241,234,0.92)] p-1">
              <button
                type="button"
                className={cn(
                  'flex h-8 w-10 items-center justify-center rounded-[10px] text-[rgba(77,62,49,0.72)] transition-colors',
                  previewMode === 'mobile' && 'bg-white text-[#2d2218] shadow-[0_8px_18px_rgba(77,55,30,0.07)]'
                )}
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={cn(
                  'flex h-8 w-10 items-center justify-center rounded-[10px] text-[rgba(77,62,49,0.72)] transition-colors',
                  previewMode === 'desktop' && 'bg-white text-[#2d2218] shadow-[0_8px_18px_rgba(77,55,30,0.07)]'
                )}
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {previewError ? <PanelMessage description={previewError} title="Preview unavailable" tone="danger" /> : null}

          {previewLoading ? (
            <PanelMessage
              description="Rendering the current compose payload into preview HTML."
              title="Building Preview"
            />
          ) : previewHtml ? (
            <div
              className={cn(
                'flex justify-center rounded-[20px] border border-[rgba(118,95,68,0.16)] bg-[linear-gradient(180deg,rgba(247,239,229,0.96)_0%,rgba(243,234,223,0.96)_100%)] p-2 transition-all',
                previewMode === 'mobile' ? 'h-[248px]' : 'h-[188px]'
              )}
            >
              <iframe
                srcDoc={previewHtml}
                title="Compose Preview"
                className={cn(
                  'rounded-[14px] border border-[rgba(118,95,68,0.18)] bg-white',
                  previewMode === 'mobile' ? 'h-full w-[220px]' : 'h-full w-full'
                )}
              />
            </div>
          ) : (
            <PanelMessage
              description="Preview the active compose row to inspect responsive email output before drafting or sending."
              title="No Preview Loaded"
              tone="warning"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
