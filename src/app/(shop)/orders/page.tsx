import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Package, ShoppingBag } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getOrderDeps } from '@/presentation/lib/order-deps';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/empty-state';
import { OrderStatusBadge } from './_components/OrderStatusBadge';

export const metadata = {
  title: 'Mis pedidos — Gamer Gear Colombia',
  description: 'Revisa el estado y el historial de tus pedidos.',
};

/**
 * Order history page — Phase 4 (D).
 *
 * Server component. Flow:
 *  1. Auth-gate: redirect to /login?next=/orders if no session.
 *  2. List all orders for the user, newest first (use case handles
 *     the sort; the repository returns the rest).
 *  3. Render as cards, each linking to the order detail page.
 *  4. Empty state with a "Ir a la tienda" CTA.
 */
export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?next=%2Forders');
  }

  const { listUserOrders } = getOrderDeps();
  const orders = await listUserOrders({ userId: session.user.id });

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />}
          title="Aún no has realizado ningún pedido"
          description="Cuando completes una compra, aparecerá aquí con su estado actualizado."
          action={
            <Button asChild size="lg">
              <Link href="/products">Ir a la tienda</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <ul role="list" className="space-y-3">
        {orders.map((order) => {
          const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
          const dateLabel = formatOrderDate(order.createdAt);
          return (
            <li key={order.id}>
              <Card className="transition-colors hover:border-border">
                <CardContent className="p-0">
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="border-border/60 hidden h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground sm:flex">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-semibold">
                            Pedido {shortId(order.id)}
                          </p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {dateLabel} · {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <p className="font-display text-lg font-bold tabular-nums sm:text-xl">
                        {formatCOP(order.total)}
                      </p>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mis pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá el estado y el detalle de tus compras.
        </p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/products">Seguir comprando</Link>
      </Button>
    </div>
  );
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatOrderDate(date: Date | undefined): string {
  if (!date) return 'Fecha desconocida';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
