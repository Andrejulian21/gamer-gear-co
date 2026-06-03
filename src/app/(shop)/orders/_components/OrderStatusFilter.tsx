import Link from 'next/link';

import { cn } from '@/presentation/lib/utils';
import { OrderStatusSchema, type OrderStatus } from '@/domain/entities/OrderStatus';

export type OrderStatusFilterValue = 'ALL' | OrderStatus;

interface OrderStatusFilterProps {
  active: OrderStatusFilterValue;
}

const TABS: Array<{ value: OrderStatusFilterValue; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'PAID', label: 'Pagados' },
  { value: 'SHIPPED', label: 'Enviados' },
  { value: 'DELIVERED', label: 'Entregados' },
  { value: 'CANCELLED', label: 'Cancelados' },
  { value: 'FAILED', label: 'Fallidos' },
];

export const ORDER_STATUS_VALUES = OrderStatusSchema.options;

/**
 * Order status filter (Phase 6).
 *
 * Server component — plain <Link>s with a `?status=...` query param.
 * No client state. The orders page reads `searchParams.status` and
 * narrows the list. The active tab is highlighted using the same
 * `pathname === href` pattern the navbar uses, with a small twist:
 * the "Todos" tab is active when the page has no status param.
 */
export function OrderStatusFilter({ active }: OrderStatusFilterProps) {
  return (
    <nav aria-label="Filtrar pedidos por estado" className="border-border/60 -mx-1 overflow-x-auto">
      <ul role="list" className="flex items-center gap-1 px-1">
        {TABS.map((tab) => {
          const href = tab.value === 'ALL' ? '/orders' : `/orders?status=${tab.value}`;
          const isActive = active === tab.value;
          return (
            <li key={tab.value} className="shrink-0">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                data-status-filter={tab.value}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
