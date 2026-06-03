import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { formatCOP } from '@/presentation/lib/price-format';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/empty-state';
import { Button } from '@/presentation/components/ui/button';
import { OrderStatusBadge } from '@/app/(shop)/orders/_components/OrderStatusBadge';
import { OrderStatus, type OrderStatus as OrderStatusType } from '@/domain/entities/OrderStatus';

import { OrdersFilterBar } from './_components/OrdersFilterBar';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Pedidos — Admin — Gamer Gear Colombia',
};

interface PageProps {
  searchParams: { page?: string; status?: string };
}

const PAGE_SIZE = 20;

/**
 * Admin orders listing — Phase 5 (C1).
 *
 * Server component. Flow:
 *  1. Auth-gate. The /admin/* middleware already enforces the ADMIN
 *     role, but we double-check the session in the page itself so
 *     the redirect target matches the convention used by other
 *     protected pages.
 *  2. Parse `?page=N&status=...` and call the admin use case.
 *  3. Render a table-friendly list of cards. Each card links to
 *     /admin/orders/[id] for the detail view.
 *  4. <OrdersFilterBar /> for status filtering. The bar is a
 *     client form that submits via GET so the URL stays the source
 *     of truth (enables bookmarking, sharing, server-rendered list).
 *
 * The list is intentionally capped at PAGE_SIZE per page. The use
 * case returns at most that many rows. The orchestrator (integrator)
 * will add a real <Pagination /> component; for now we render
 * "Siguiente" / "Anterior" links via search params so the
 * component is testable without depending on beta's pagination.
 */
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/login?next=%2Fadmin%2Forders');
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const rawStatus = searchParams.status;
  const statusFilter: OrderStatusType | undefined =
    rawStatus && (rawStatus as OrderStatusType) in OrderStatus
      ? (rawStatus as OrderStatusType)
      : undefined;

  const { listAllOrders } = getAdminDeps();
  const orders = await listAllOrders({
    filters: statusFilter ? { status: statusFilter } : {},
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="mb-6">
        <OrdersFilterBar currentStatus={statusFilter} />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" aria-hidden="true" />}
          title="No hay pedidos"
          description={
            statusFilter
              ? `No se encontraron pedidos con el estado "${statusFilter}".`
              : 'Aún no se han registrado pedidos en la tienda.'
          }
          action={
            <Button asChild variant="outline">
              <Link href="/admin/orders">Ver todos los pedidos</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul role="list" className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Card className="transition-colors hover:border-border">
                  <CardContent className="p-0">
                    <Link
                      href={`/admin/orders/${order.id}`}
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
                            {formatOrderDate(order.createdAt)} · {order.items.length}{' '}
                            {order.items.length === 1 ? 'producto' : 'productos'}
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
            ))}
          </ul>

          <PaginationControls
            page={page}
            pageSize={PAGE_SIZE}
            rowCount={orders.length}
            statusFilter={statusFilter}
          />
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona el estado y el seguimiento de los pedidos de la tienda.
        </p>
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  pageSize,
  rowCount,
  statusFilter,
}: {
  page: number;
  pageSize: number;
  rowCount: number;
  statusFilter: OrderStatusType | undefined;
}) {
  const hasNext = rowCount === pageSize;
  const hasPrev = page > 1;
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (statusFilter) params.set('status', statusFilter);
    return `/admin/orders?${params.toString()}`;
  };
  return (
    <nav
      aria-label="Paginación de pedidos"
      className="mt-6 flex items-center justify-between gap-2"
    >
      <p className="text-xs text-muted-foreground">
        Página {page} · {rowCount} {rowCount === 1 ? 'pedido' : 'pedidos'}
      </p>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page - 1)}>Anterior</Link>
          </Button>
        ) : null}
        {hasNext ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page + 1)}>Siguiente</Link>
          </Button>
        ) : null}
      </div>
    </nav>
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
