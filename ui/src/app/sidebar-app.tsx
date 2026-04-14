import { BarChart3, PenSquare, SendHorizontal } from 'lucide-react';

import { StatusBadge } from '@/components/sidebar/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsPanel } from '@/features/analytics/analytics-panel';
import { ComposePanel } from '@/features/compose/compose-panel';
import { OutboundPanel } from '@/features/outbound/outbound-panel';
import { hasGoogleScriptRuntime } from '@/lib/google-script';

const tabs = [
  { icon: PenSquare, label: 'Compose', value: 'compose' },
  { icon: SendHorizontal, label: 'Queue', value: 'outbound' },
  { icon: BarChart3, label: 'Analytics', value: 'analytics' },
] as const;

export function SidebarApp() {
  const isLiveBridge = hasGoogleScriptRuntime();

  return (
    <div className="sidebar-shell flex h-screen max-w-[300px] flex-col overflow-hidden">
      <header className="border-b border-[rgba(118,95,68,0.16)] px-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[25px] leading-none font-semibold tracking-[-0.04em] text-[#2d2218]">Gmail Studio</h1>
            <p className="mt-1 text-[11px] leading-snug text-[rgba(77,62,49,0.72)]">
              Calm compose, queue, and analytics controls for the active workbook.
            </p>
          </div>
          <StatusBadge tone={isLiveBridge ? 'live' : 'mock'}>{isLiveBridge ? 'Live bridge' : 'Mock mode'}</StatusBadge>
        </div>
      </header>

      <Tabs defaultValue="compose" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-[rgba(118,95,68,0.16)] px-3 py-3">
          <TabsList className="grid h-11 grid-cols-3">
            {tabs.map(({ icon: Icon, label, value }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 px-0"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-2.5 py-3.5">
            <TabsContent value="compose" className="m-0 focus-visible:outline-none">
              <ComposePanel />
            </TabsContent>
            <TabsContent value="outbound" className="m-0 focus-visible:outline-none">
              <OutboundPanel />
            </TabsContent>
            <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
              <AnalyticsPanel />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      <footer className="border-t border-[rgba(118,95,68,0.16)] px-3 py-3">
        <div className="flex items-center justify-between gap-3 text-[11px] text-[rgba(77,62,49,0.72)]">
          <span>{isLiveBridge ? 'Connected to the bound spreadsheet.' : 'Local preview with mock Apps Script responses.'}</span>
          <StatusBadge tone="accent">300px</StatusBadge>
        </div>
      </footer>
    </div>
  );
}
