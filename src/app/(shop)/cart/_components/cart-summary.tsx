import Link from 'next/link';
import { ArrowRight, Truck, Lock } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Separator } from '@/presentation/components/ui/separator';
import { Badge } from '@/presentation/components/ui/badge';
import { formatCOP } from '@/presentation/lib/price-format';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

/**
 * Order summary panel for the cart page.
 *
 * Server component — receives a pre-computed subtotal from the page
 * and renders the breakdown plus the "Continuar al checkout" CTA.
 *
 * Checkout is intentionally disabled with a "Pronto" badge because
 * the checkout flow ships in Phase 4 (Wompi integration).
 */
export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  const freeShippingThreshold = 300_000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resumen del pedido</span>
          <Badge variant="secondary" className="font-normal">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums">{formatCOP(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="text-muted-foreground">Calculado en el checkout</dd>
          </div>
        </dl>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="font-display text-xl font-bold tabular-nums">{formatCOP(subtotal)}</span>
        </div>

        {remainingForFreeShipping > 0 ? (
          <div className="border-border/60 bg-muted/30 flex items-start gap-2 rounded-md border p-3 text-xs">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              Te faltan{' '}
              <span className="font-medium text-foreground">
                {formatCOP(remainingForFreeShipping)}
              </span>{' '}
              para envío gratis a nivel nacional.
            </p>
          </div>
        ) : (
          <div className="border-primary/30 bg-primary/10 flex items-start gap-2 rounded-md border p-3 text-xs">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-foreground">
              ¡Genial! Tu pedido califica para <span className="font-semibold">envío gratis</span>.
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="default"
          size="lg"
          disabled
          className="w-full"
          aria-label="Continuar al checkout — disponible pronto"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Continuar al checkout
          <Badge variant="secondary" className="bg-background/20 ml-2 text-primary-foreground">
            Pronto
          </Badge>
        </Button>

        <Link
          href="/products"
          className="block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Seguir comprando
          <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
