import { ArrowDown, ArrowRight, ArrowUp, type LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/presentation/components/ui/card';
import { cn } from '@/presentation/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  /** Optional trend indicator rendered below the value. */
  trend?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
  };
  icon?: LucideIcon;
  className?: string;
}

/**
 * Stat tile for the admin dashboard.
 *
 * Pure presentational. Renders a small label, a large numeric/string
 * value, and an optional trend chip with a colored arrow. The icon
 * is rendered in the top-right corner when provided.
 */
export function StatCard({ title, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/40', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {Icon ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/50 text-muted-foreground"
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {trend ? <TrendIndicator trend={trend} /> : null}
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: NonNullable<StatCardProps['trend']> }) {
  const { direction, label } = trend;
  const colorClass =
    direction === 'up'
      ? 'text-lime-400'
      : direction === 'down'
        ? 'text-red-400'
        : 'text-muted-foreground';
  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : ArrowRight;

  return (
    <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </p>
  );
}
