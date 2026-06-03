import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';

/**
 * Shop-scoped 404 — caught inside the (shop) layout, so the ShopNavbar
 * and ShopFooter are already wrapping this view. We just render the
 * 404 body. The shell pattern is shared with the global 404, but
 * simpler because the layout supplies chrome.
 *
 * The (admin) tree has its own (admin)/admin/not-found.tsx — that one
 * is intentionally generic to avoid leaking that /admin exists. This
 * 404 is a public-facing fallback for /products, /brands, /cart, etc.
 * so it can be more helpful.
 */
export default function ShopNotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 text-muted-foreground"
      >
        <SearchX className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Es posible que el producto o la sección que buscás ya no exista. Volvé a la tienda o revisá
        tus pedidos.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/products" data-testid="shop-not-found-cta-products">
            Ir a la tienda
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/orders" data-testid="shop-not-found-cta-orders">
            Ver mis pedidos
          </Link>
        </Button>
      </div>
    </div>
  );
}
