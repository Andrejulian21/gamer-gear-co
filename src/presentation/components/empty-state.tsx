import * as React from 'react';
import { Inbox } from 'lucide-react';

import { cn } from '@/presentation/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state for catalogs, filters and search results.
 *
 * The icon is decorative by default; pass `icon` only if it carries
 * meaning you want read out by assistive tech.
 */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-card/50 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
      role="status"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden={icon ? undefined : 'true'}
      >
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
