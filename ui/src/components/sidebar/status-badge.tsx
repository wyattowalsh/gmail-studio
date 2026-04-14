import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: ReactNode;
  className?: string;
  tone?: 'accent' | 'danger' | 'live' | 'mock' | 'neutral' | 'pending' | 'success' | 'warning';
}

export function StatusBadge({ children, className, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] leading-none',
        className
      )}
    >
      {children}
    </span>
  );
}
