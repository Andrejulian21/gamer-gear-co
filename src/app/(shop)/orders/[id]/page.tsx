import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, MapPin, Receipt } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getOrderDeps } from '@/presentation/lib/order-deps';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Separator } from '@/presentation/components/ui/separator';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';

import { OrderStatusBadge } from '../_components/OrderStatusBadge';
import { OrderItemsTable, type OrderItemsTableItem } from '../_components/OrderItemsTable';
import { OrderPoller } from '../_components/OrderPoller';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Pedido ${params.id.slice(0, 8)} — Gamer Gear Colombia`,
  };
}

/**
 * Order detail page — Phase 4 (D).
 *
 * Server component. Flow:
 *  1. Auth-gate. Missing -> redirect to /login?next=/orders/<id>.
 *  2. GetOrder enforces ownership (USER sees only their own, ADMIN
 *     sees any). A non-owner attempt returns OrderNotFoundError
 *     which we map to `notFound()` (a 404 leaks no info).
 *  3. Hydrate items with product display data (name, image, slug).
 *  4. Render header + items table + shipping address card.
 *  5. Mount <OrderPoller /> for PENDING orders to bridge the race
 *     between the Wompi redirect and the webhook firing.
 */
export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?next=%2Forders%2F${params.id}`);
  }

  const { getOrder } = getOrderDeps();
  let order;
  try {
    order = await getOrder({
      orderId: params.id,
      requestingUserId: session.user.id,
      userRole: (session.user.role as 'USER' | 'ADMIN' | undefined) ?? 'USER',
    });
  } catch (err) {
    if (err instanceof OrderNotFoundError) notFound();
    throw err;
  }

  // Hydrate items with product display data (name, image, slug).
  const productRepo = new PrismaProductRepository();
  const products = await productRepo.findMany({ limit: 200 });
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver a mis pedidos
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          ID: <span className="font-mono">{order.id}</span>
        </p>
      </div>

      <OrderPoller orderId={order.id} initialStatus={order.status} />

      <header className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Pedido {order.id.slice(0, 8)}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
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

        {order.status === 'PENDING' ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
            Tu pago está siendo procesado. Te avisaremos por email cuando se confirme.
          </p>
        ) : null}
        {order.status === 'FAILED' ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm">
            <p className="font-medium text-destructive">El pago de este pedido fue rechazado.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Si crees que es un error, contáctanos a soporte.
            </p>
          </div>
        ) : null}
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
