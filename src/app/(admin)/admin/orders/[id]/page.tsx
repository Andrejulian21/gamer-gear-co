import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, MapPin, Receipt } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import { OrderStatus } from '@/domain/entities/OrderStatus';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Separator } from '@/presentation/components/ui/separator';
import { OrderStatusBadge } from '@/app/(shop)/orders/_components/OrderStatusBadge';
import {
  OrderItemsTable,
  type OrderItemsTableItem,
} from '@/app/(shop)/orders/_components/OrderItemsTable';

import { OrderStatusUpdateForm } from './_components/OrderStatusUpdateForm';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Pedido ${params.id.slice(0, 8)} — Admin — Gamer Gear Colombia`,
  };
}

/**
 * Admin order detail — Phase 5 (C1).
 *
 * Re-uses the presentational components from
 * `src/app/(shop)/orders/_components/` (OrderItemsTable,
 * OrderStatusBadge) to keep visual parity with the customer-facing
 * order detail page. Differences:
 *   - No auth-ownership check (admin sees any order).
 *   - Status update form (server action).
 *   - Shows the user's email/id at the top.
 *
 * Allowed transitions mirror the D4 lifecycle enforced by
 * `UpdateOrderStatus`: PENDING -> {CANCELLED, FAILED},
 * PAID -> SHIPPED, SHIPPED -> DELIVERED. We pass the full list of
 * valid next states to the form; the form hides the select when
 * there are none.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  PENDING: ['CANCELLED', 'FAILED'],
  PAID: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect(`/login?next=%2Fadmin%2Forders%2F${params.id}`);
  }

  const { getOrderForAdmin } = getAdminDeps();
  let order;
  try {
    order = await getOrderForAdmin({ orderId: params.id });
  } catch (err) {
    if (err instanceof OrderNotFoundError) notFound();
    throw err;
  }

  // Hydrate items with product display data (name, image, slug)
  // and resolve the user's email for the header.
  const productRepo = new PrismaProductRepository();
  const userRepo = new PrismaUserRepository();
  const [products, user] = await Promise.all([
    productRepo.findMany({ limit: 200 }),
    userRepo.findById(order.userId),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));

  const items: OrderItemsTableItem[] = order.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      return {
        productId: item.productId,
        product: { name: 'Producto', image: '', slug: '' },
        quantity: item.quantity,
        price: item.price,
      };
    }
    return {
      productId: item.productId,
      product: {
        name: product.name,
        image: product.images[0] ?? '',
        slug: product.slug,
      },
      quantity: item.quantity,
      price: item.price,
    };
  });

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver a pedidos
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          ID: <span className="font-mono">{order.id}</span>
        </p>
      </div>

      <header className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Pedido {order.id.slice(0, 8)}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {formatOrderDate(order.createdAt)} ·{' '}
          {user ? (
            <>
              Cliente: <span className="font-medium text-foreground">{user.name}</span> (
              <span className="font-mono">{user.email}</span>)
            </>
          ) : (
            <>
              Cliente: <span className="font-mono">{order.userId}</span>
            </>
          )}
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrderItemsTable items={items} />
            <Separator />
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatCOP(order.total)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Envío</dt>
                <dd className="text-muted-foreground">Calculado al despacho</dd>
              </div>
            </dl>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="font-display text-2xl font-bold tabular-nums">
                {formatCOP(order.total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Dirección de envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p>C.P. {order.shippingAddress.zipCode}</p>
              <p className="mt-2">Tel: {order.shippingAddress.phone}</p>
            </address>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado del pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusUpdateForm
              orderId={order.id}
              currentStatus={order.status}
              allowedNext={allowedNext}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatOrderDate(date: Date | undefined): string {
  if (!date) return 'Fecha desconocida';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
