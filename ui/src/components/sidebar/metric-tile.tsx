import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/sidebar/status-badge';

interface MetricTileProps {
  label: string;
  tone?: 'accent' | 'default' | 'danger' | 'success';
  value: ReactNode;
  hint?: string;
}

const badgeTones = {
  accent: 'accent',
  danger: 'danger',
  default: 'neutral',
  success: 'success',
} as const;

export function MetricTile({ label, tone = 'default', value, hint }: MetricTileProps) {
  return (
    <div data-slot="metric-tile">
      <StatusBadge tone={badgeTones[tone]}>{label}</StatusBadge>
      <div data-slot="metric-value">{value}</div>
      {hint ? <div data-slot="metric-hint">{hint}</div> : null}
    </div>
  );
}
