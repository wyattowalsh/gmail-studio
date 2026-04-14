import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';

import { MetricTile } from '@/components/sidebar/metric-tile';
import { PanelMessage } from '@/components/sidebar/panel-message';
import { StatusBadge } from '@/components/sidebar/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { gmailStudioClient, getErrorMessage } from '@/lib/google-script';
import type { AnalyticsSummary, AnalyticsTrend } from '@/lib/types';

const emptySummary: AnalyticsSummary = { clicks: 0, opens: 0, total: 0 };

export function AnalyticsPanel() {
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [trends, setTrends] = useState<AnalyticsTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSummary, nextTrends] = await Promise.all([
        gmailStudioClient.getAnalyticsSummary(),
        gmailStudioClient.getAnalyticsTrends(),
      ]);

      setSummary(nextSummary);
      setTrends(nextTrends);
      setLastSyncedAt(new Date());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const maxOpens = Math.max(...trends.map((trend) => trend.opens), 1);
  const openRate = summary.total > 0 ? Math.round((summary.opens / summary.total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="Opens" tone="accent" value={summary.opens} />
        <MetricTile label="Clicks" tone="success" value={summary.clicks} />
        <MetricTile label="Events" value={summary.total} />
        <MetricTile label="Open Rate" value={`${openRate}%`} hint="Open / total" />
      </div>

      {error ? (
        <PanelMessage
          action={
            <Button variant="outline" className="h-8 px-3 text-[11px]" onClick={() => void loadAnalytics()}>
              Retry
            </Button>
          }
          description={error}
          title="Analytics Unavailable"
          tone="danger"
        />
      ) : null}

      <Card className="gap-4">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>7-Day Activity</CardTitle>
              <p className="mt-2 text-[11px] leading-snug text-[rgba(77,62,49,0.72)]">
                {lastSyncedAt
                  ? `Synced at ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                  : 'Awaiting the first sync from the Analytics sheet.'}
              </p>
            </div>
            <StatusBadge tone="accent">
              <TrendingUp className="h-3.5 w-3.5" />
              Trend
            </StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {loading ? (
            <PanelMessage
              description="Reading summary counts and seven-day trends from the Analytics sheet."
              title="Loading analytics"
            />
          ) : trends.length === 0 ? (
            <PanelMessage
              description="No tracked opens or clicks were found in the last seven days."
              title="No recent activity"
              tone="warning"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex h-24 items-end gap-1 rounded-[18px] border border-[rgba(118,95,68,0.16)] bg-[rgba(255,251,245,0.82)] p-3">
                {trends.map((trend) => {
                  const barHeight = Math.max(10, Math.round((trend.opens / maxOpens) * 100));

                  return (
                    <div key={trend.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full rounded-t-[8px] border border-[rgba(118,95,68,0.12)] bg-[linear-gradient(180deg,#7f9a7a_0%,#60795b_100%)] transition-[height]"
                          style={{ height: `${barHeight}%` }}
                          title={`${trend.date}: ${trend.opens} opens / ${trend.clicks} clicks`}
                        />
                      </div>
                      <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-[rgba(77,62,49,0.56)]">
                        {trend.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                {trends.map((trend) => (
                  <div
                    key={trend.date}
                    className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em]"
                  >
                    <span className="text-[rgba(77,62,49,0.56)]">{trend.date}</span>
                    <span className={trend.opens > 0 ? 'font-semibold text-[#2d2218]' : 'text-[rgba(77,62,49,0.4)]'}>
                      {trend.opens} opens / {trend.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="h-9 w-full text-[11px]" onClick={() => void loadAnalytics()} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5${loading ? ' animate-spin' : ''}`} />
            Sync Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
