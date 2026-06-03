import { redirect } from 'next/navigation';
import { ShoppingBag, ChevronLeft, ArrowRight } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getCartDeps } from '@/presentation/lib/cart-deps';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { getTotalItems } from '@/domain/entities/Cart';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Separator } from '@/presentation/components/ui/separator';
import Link from 'next/link';

import { CartItemRow, type CartItemView } from './_components/cart-item-row';
import { CartSummary } from './_components/cart-summary';
import { EmptyCart } from './_components/empty-cart';

export const metadata = {
  title: 'Carrito — Gamer Gear Colombia',
  description: 'Revisa los productos en tu carrito antes de continuar al pago.',
};

/**
 * Cart page — auth-gated (D1, D4).
 *
 * Flow:
 * 1. Resolve the session. If absent, redirect to `/login?next=/cart`.
 * 2. Load the user's cart aggregate from the domain layer.
 * 3. Join cart items with the corresponding products to build a
 *    presentation-friendly `CartItemView[]` (name, image, unit price).
 *    This is D3 — the Cart aggregate stays pure, enrichment happens here.
 * 4. Hand the views to `<CartItemRow>` and the subtotal to `<CartSummary>`.
 */
export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) {
    // Middleware would have already redirected, but the safety net stays
    // here so a direct hit on this server component still 302s cleanly.
    redirect('/login?next=%2Fcart');
  }

  const { getCart } = getCartDeps();
  const cart = await getCart({ userId: session.user.id });
  const itemCount = getTotalItems(cart);

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        <EmptyCart />
      </div>
    );
  }

  // Hydrate the cart items with product display data (D3).
  const productRepo = new PrismaProductRepository();
  const products = await productRepo.findMany({ limit: 100 });
  const productById = new Map(products.map((p) => [p.id, p]));

  const views: CartItemView[] = cart.items
    .map((item): CartItemView | null => {
      const product = productById.get(item.productId);
      if (!product || product.images.length === 0) return null;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]!,
        unitPrice: product.price,
        stock: product.stock,
        quantity: item.quantity,
      };
    })
    .filter((v): v is CartItemView => v !== null);

  // If every item references a deleted product, treat the cart as empty.
  if (views.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        <EmptyCart />
      </div>
    );
  }

  const subtotal = views.reduce((acc, v) => acc + v.unitPrice * v.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-label="Productos en tu carrito">
          <div className="border-border/60 bg-card/50 rounded-xl border p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-medium text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'unidad' : 'unidades'} en tu carrito
              </h2>
            </div>
            <Separator />
            <ul role="list" className="divide-border/60 divide-y">
              {views.map((item) => (
                <CartItemRow key={item.productId} item={item} initialCartCount={itemCount} />
              ))}
            </ul>
          </div>
        </section>

        <aside aria-label="Resumen del pedido" className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary subtotal={subtotal} itemCount={itemCount} />
        </aside>
      </div>

      <div className="mt-12 text-xs text-muted-foreground">
        Los precios incluyen IVA. El envío se calcula en el siguiente paso.
        <span className="ml-2 hidden sm:inline">Subtotal referencial: {formatCOP(subtotal)}</span>
      </div>

      <div className="border-border/60 mt-6 flex flex-col-reverse items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="ghost" size="default">
          <Link href="/products">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Seguir comprando
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto sm:min-w-[16rem]"
          data-testid="checkout-link-bottom"
        >
          <Link href="/checkout">
            Proceder al pago
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Tu carrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá los productos antes de continuar al pago.
        </p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/products">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Seguir comprando
        </Link>
      </Button>
    </div>
  );
}
