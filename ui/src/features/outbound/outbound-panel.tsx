import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

import { ActionFeed } from '@/components/sidebar/action-feed';
import { MetricTile } from '@/components/sidebar/metric-tile';
import { PanelMessage } from '@/components/sidebar/panel-message';
import { StatusBadge } from '@/components/sidebar/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { gmailStudioClient, getErrorMessage } from '@/lib/google-script';
import type { ActionFeedItem, QuotaForecast } from '@/lib/types';
import { cn } from '@/lib/utils';

const emptyQuota: QuotaForecast = {
  draft_ready_now: 0,
  is_at_risk: false,
  remaining: 0,
  scheduled_future: 0,
  send_ready_now: 0,
  unsent_total: 0,
};

type OutboundMutation = 'draftScheduled' | 'sendAll' | 'sendScheduled';

export function OutboundPanel() {
  const [quota, setQuota] = useState<QuotaForecast>(emptyQuota);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmedActions, setConfirmedActions] = useState<ActionFeedItem[]>([]);
  const [optimisticActions, addOptimisticAction] = useOptimistic(
    confirmedActions,
    (currentState, nextAction: ActionFeedItem) => [nextAction, ...currentState].slice(0, 3)
  );
  const [optimisticQuota, addOptimisticQuota] = useOptimistic(
    quota,
    (currentState, partialState: Partial<QuotaForecast>) => ({ ...currentState, ...partialState })
  );
  const [isPending, startTransition] = useTransition();

  const loadQuota = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextQuota = await gmailStudioClient.getQuotaForecast();
      setQuota(nextQuota);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuota();
  }, []);

  const pushConfirmedAction = (nextAction: ActionFeedItem) => {
    setConfirmedActions((currentState) => [nextAction, ...currentState].slice(0, 3));
  };

  const runOutboundMutation = (mutation: OutboundMutation) => {
    const actionId = crypto.randomUUID();

    const config = {
      draftScheduled: {
        label: 'Prepare Scheduled Drafts',
        optimisticQuota: {
          draft_ready_now: 0,
          unsent_total: Math.max(0, quota.unsent_total - quota.draft_ready_now),
        } satisfies Partial<QuotaForecast>,
      },
      sendAll: {
        label: 'Send All Unsent',
        optimisticQuota: {} satisfies Partial<QuotaForecast>,
      },
      sendScheduled: {
        label: 'Send Scheduled Now',
        optimisticQuota: {
          send_ready_now: 0,
          unsent_total: Math.max(0, quota.unsent_total - quota.send_ready_now),
        } satisfies Partial<QuotaForecast>,
      },
    }[mutation];

    addOptimisticAction({
      id: actionId,
      label: config.label,
      detail: 'Queue mutation started. Results will refresh after the backend finishes.',
      status: 'pending',
    });
    addOptimisticQuota(config.optimisticQuota);

    startTransition(() => {
      void (async () => {
        try {
          if (mutation === 'draftScheduled') {
            const results = await gmailStudioClient.createScheduledDraftBatch();
            pushConfirmedAction({
              id: actionId,
              label: config.label,
              detail: `Created ${results.length} scheduled drafts.`,
              status: 'success',
            });
          } else if (mutation === 'sendScheduled') {
            const results = await gmailStudioClient.sendScheduledBatch();
            pushConfirmedAction({
              id: actionId,
              label: config.label,
              detail: `Sent ${results.length} scheduled emails.`,
              status: 'success',
            });
          } else {
            const results = await gmailStudioClient.sendUnsentBatch();
            pushConfirmedAction({
              id: actionId,
              label: config.label,
              detail: `Processed ${results.length} unsent rows.`,
              status: 'success',
            });
          }

          const nextQuota = await gmailStudioClient.getQuotaForecast();
          setQuota(nextQuota);
        } catch (caughtError) {
          pushConfirmedAction({
            id: actionId,
            label: config.label,
            detail: getErrorMessage(caughtError),
            status: 'error',
          });
          const nextQuota = await gmailStudioClient.getQuotaForecast().catch(() => quota);
          setQuota(nextQuota);
        }
      })();
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="Quota Remaining" value={optimisticQuota.remaining} />
        <MetricTile label="Queued Rows" tone="accent" value={optimisticQuota.unsent_total} />
        <MetricTile label="Ready to Send" tone="success" value={optimisticQuota.send_ready_now} />
        <MetricTile label="Ready to Draft" value={optimisticQuota.draft_ready_now} />
      </div>

      <Card className="gap-4">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Outbound Queue</CardTitle>
              <p className="mt-2 text-[11px] leading-snug text-[rgba(77,62,49,0.72)]">
                Keep the sheet as the source of truth while using these controls to move draft and send work forward.
              </p>
            </div>
            <StatusBadge tone={optimisticQuota.is_at_risk ? 'warning' : 'success'}>
              {optimisticQuota.is_at_risk ? 'Needs attention' : 'Healthy'}
            </StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <PanelMessage
            description="The Outbound sheet stays the source of truth. Use these controls to move rows forward without changing the contract."
            title="Queue Discipline"
            tone="info"
          />

          {loading ? (
            <PanelMessage
              description="Calculating quota pressure and dispatchable rows from Outbound."
              title="Loading Queue"
            />
          ) : null}

          {error ? <PanelMessage description={error} title="Queue refresh paused" tone="danger" /> : null}

          {!loading ? (
            <div className="space-y-2 rounded-[18px] border border-[rgba(118,95,68,0.16)] bg-[rgba(250,243,233,0.92)] p-3 text-[10px] font-mono uppercase tracking-[0.12em]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(77,62,49,0.56)]">Scheduled Future</span>
                <span className="font-semibold text-[#2d2218]">{optimisticQuota.scheduled_future}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[rgba(77,62,49,0.56)]">Queue Health</span>
                <span className={cn('font-semibold', optimisticQuota.is_at_risk ? 'text-[#8f4a42]' : 'text-[#496247]')}>
                  {optimisticQuota.is_at_risk ? 'Needs Attention' : 'Healthy'}
                </span>
              </div>
            </div>
          ) : null}

          {optimisticQuota.is_at_risk && !loading ? (
            <PanelMessage
              description="Unsent volume is close to or above the remaining Gmail quota. Draft first or split sends across a later window."
              title="Quota Risk"
              tone="warning"
            />
          ) : null}

          <div className="grid gap-2">
            <Button variant="outline" className="h-10 justify-start px-3 text-[11px]" onClick={() => runOutboundMutation('sendScheduled')} disabled={loading || isPending}>
              Send Scheduled Now
            </Button>
            <Button variant="outline" className="h-10 justify-start px-3 text-[11px]" onClick={() => runOutboundMutation('draftScheduled')} disabled={loading || isPending}>
              Prepare Scheduled Drafts
            </Button>
            <Button className="h-10 justify-start px-3 text-[11px]" onClick={() => runOutboundMutation('sendAll')} disabled={loading || isPending}>
              Send All Unsent
            </Button>
          </div>

          <ActionFeed items={optimisticActions} />

          <Button variant="outline" className="h-9 w-full text-[11px]" onClick={() => void loadQuota()} disabled={loading || isPending}>
            <RefreshCw className={cn('mr-2 h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh Queue Signal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
