import Link from 'next/link';
import { Receipt } from 'lucide-react';

import type { Order } from '@/domain/entities/Order';
import { formatCOP } from '@/presentation/lib/price-format';
import { EmptyState } from '@/presentation/components/empty-state';
import { StatusBadge } from './status-badge';

export interface RecentOrdersListProps {
  orders: Order[];
  /**
   * Optional map of user id -> email so each row can show the
   * customer. The dashboard pre-fetches this once.
   */
  userEmailById?: Map<string, string>;
}

/**
 * Recent-orders tile of the admin dashboard.
 *
 * Compact table: order id (truncated), customer email, total,
 * status badge, date. Each row links to the order detail page.
 */
export function RecentOrdersList({ orders, userEmailById }: RecentOrdersListProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-6 w-6" aria-hidden="true" />}
        title="Sin pedidos recientes"
        description="Cuando se registren pedidos, aparecerán acá."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-zinc-800">
            <th scope="col" className="px-2 py-2 text-left font-medium">
              Pedido
            </th>
            <th scope="col" className="hidden px-2 py-2 text-left font-medium sm:table-cell">
              Cliente
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              Total
            </th>
            <th scope="col" className="px-2 py-2 text-left font-medium">
              Estado
            </th>
            <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/30"
            >
              <td className="px-2 py-2">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono text-xs font-medium text-foreground hover:text-lime-400"
                >
                  {shortId(order.id)}
                </Link>
              </td>
              <td className="hidden truncate px-2 py-2 text-muted-foreground sm:table-cell">
                {userEmailById?.get(order.userId) ?? '—'}
              </td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums">
                {formatCOP(order.total)}
              </td>
              <td className="px-2 py-2">
                <StatusBadge status={order.status} />
              </td>
              <td className="hidden px-2 py-2 text-right text-xs text-muted-foreground md:table-cell">
                {formatOrderDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatOrderDate(date: Date | undefined): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
