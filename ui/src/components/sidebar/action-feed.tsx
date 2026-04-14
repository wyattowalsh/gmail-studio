import type { ActionFeedItem } from '@/lib/types';

import { StatusBadge } from '@/components/sidebar/status-badge';

interface ActionFeedProps {
  items: ActionFeedItem[];
}

export function ActionFeed({ items }: ActionFeedProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div data-slot="action-feed">
      {items.map((item) => (
        <div key={item.id} data-slot="action-feed-item" data-status={item.status}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold tracking-[-0.01em] text-[#2d2218]">{item.label}</span>
            <StatusBadge
              tone={item.status === 'success' ? 'success' : item.status === 'error' ? 'danger' : 'pending'}
            >
              {item.status}
            </StatusBadge>
          </div>
          {item.detail ? <p>{item.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
