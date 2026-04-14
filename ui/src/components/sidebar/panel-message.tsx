import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/sidebar/status-badge';

interface PanelMessageProps {
  action?: ReactNode;
  description: string;
  title: string;
  tone?: 'danger' | 'info' | 'success' | 'warning';
}

const badgeTones = {
  danger: 'danger',
  info: 'accent',
  success: 'success',
  warning: 'warning',
} as const;

export function PanelMessage({ action, description, title, tone = 'info' }: PanelMessageProps) {
  return (
    <div data-slot="panel-message" className="space-y-3">
      <div>
        <StatusBadge tone={badgeTones[tone]}>{title}</StatusBadge>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
