import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ShoppingBag } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';
import { getCheckoutSummaryAction } from './actions';
import { CheckoutForm } from './_components/CheckoutForm';

export const metadata = {
  title: 'Finalizar compra — Gamer Gear Colombia',
  description: 'Confirma tu dirección de envío y completa el pago con Wompi.',
};

/**
 * Checkout page — Phase 4 (C + D).
 *
 * Auth-gated at the page level (the auth.config middleware does not
 * protect /checkout; the page does the redirect itself so the
 * presentation layer stays self-contained and a direct hit still
 * 302s cleanly).
 *
 * Server component flow:
 *  1. Resolve the session. Missing -> redirect to /login?next=/checkout.
 *  2. Call `getCheckoutSummaryAction` (read-only server action that
 *     hydrates the cart with product display data). If the cart is
 *     empty, render an empty state with a CTA back to /products.
 *  3. Render the <CheckoutForm /> client component with the hydrated
 *     summary as initial props.
 */
export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?next=%2Fcheckout');
  }

  const result = await getCheckoutSummaryAction();
  if (!result.ok) {
    if (result.error === 'AUTH_REQUIRED') {
      redirect('/login?next=%2Fcheckout');
    }
    // EMPTY_CART — the user landed on /checkout with nothing in the cart.
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />}
          title="Tu carrito está vacío"
          description="Agrega productos al carrito antes de continuar al pago."
          action={
            <Button asChild size="lg">
              <Link href="/products">Ver productos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <CheckoutForm
        summary={result.summary}
        defaults={{
          fullName: session.user.name ?? '',
          email: session.user.email ?? '',
        }}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Finalizar compra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirma tu dirección de envío y paga con Wompi.
        </p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/cart">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Volver al carrito
        </Link>
      </Button>
    </div>
  );
}
