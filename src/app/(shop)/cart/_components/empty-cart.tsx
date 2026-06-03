import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

import { EmptyState } from '@/presentation/components/empty-state';
import { Button } from '@/presentation/components/ui/button';

/**
 * Empty cart placeholder. Renders the shared `<EmptyState>` primitive
 * with a "Ver productos" CTA back to the catalog.
 *
 * The text "Tu carrito está vacío" is the contract used by the
 * e2e test in `tests/e2e/cart.spec.ts`.
 */
export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingCart className="h-6 w-6" aria-hidden="true" />}
      title="Tu carrito está vacío"
      description="Aún no has agregado productos. Explora nuestro catálogo y encuentra tu próximo periférico gamer."
      action={
        <Button asChild variant="default" size="lg">
          <Link href="/products">Ver productos</Link>
        </Button>
      }
    />
  );
}
