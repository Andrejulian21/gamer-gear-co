import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { ShopNavbar } from '@/presentation/components/shop-navbar';
import { Button } from '@/presentation/components/ui/button';
import { ShopFooter } from '@/app/(shop)/_components/shop-footer';

/**
 * Global 404 — caught outside the (shop) layout (e.g. /this-does-not-exist).
 *
 * Mirrors the (shop) layout shell (navbar + main + footer) so the user
 * keeps the navigation context even when they hit a 404 from a deep
 * link or a typo in the URL. Two CTAs route the user back into the
 * funnel: the catalog (default recovery) or their order history
 * (recoverable state for returning customers).
 */
export default async function GlobalNotFound() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <ShopNavbar
        session={session ? { user: { name: session.user.name, role: session.user.role } } : null}
      />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex max-w-xl flex-col items-center text-center">
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
            Es posible que el enlace esté roto o que la página haya sido movida. Te dejamos algunas
            opciones para seguir navegando.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/products" data-testid="not-found-cta-products">
                Ir a la tienda
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/orders" data-testid="not-found-cta-orders">
                Ver mis pedidos
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
