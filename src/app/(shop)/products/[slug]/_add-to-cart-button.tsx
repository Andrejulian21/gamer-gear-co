'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { addToCartAction } from '@/app/(shop)/cart/actions';
import { useCartCount } from '@/presentation/hooks/use-cart-count';
import { cn } from '@/presentation/lib/utils';

interface Props {
  productId: string;
  slug: string;
  inStock: boolean;
  maxQuantity: number;
  initialCartCount: number;
}

/**
 * Add-to-cart control for the product detail page.
 *
 * Behavior:
 * - Quantity stepper is hard-capped at `maxQuantity` (server enforces too).
 * - `useOptimistic` flips the button to "Agregado" before the server
 *   confirms; the optimistic state is reset when the transition settles.
 * - The navbar badge count is updated optimistically via `useCartCount`
 *   so the user sees the cart total jump immediately.
 * - On `AUTH_REQUIRED` the user is redirected to `/login?next=...`.
 * - The whole control is disabled while a request is in flight or when
 *   the product is out of stock.
 */
export function AddToCartButton({
  productId,
  slug,
  inStock,
  maxQuantity,
  initialCartCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticAdded, setOptimisticAdded] = useOptimistic<boolean, true>(false, () => true);
  const cartCount = useCartCount(initialCartCount);

  if (!inStock) {
    return (
      <Button size="lg" disabled className="w-full" aria-label="Producto agotado">
        Agotado
      </Button>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quantity = Number.parseInt(String(formData.get('quantity') ?? '1'), 10);

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error('Cantidad inválida');
      return;
    }

    startTransition(async () => {
      // Optimistic UI: bump badge count + flip button BEFORE the server
      // round-trip. If the action fails, we revert with a toast.
      cartCount.increment(quantity);
      setOptimisticAdded(true);

      const result = await addToCartAction(formData);

      if (!result.ok) {
        // Roll back the optimistic badge change.
        cartCount.decrement(quantity);

        switch (result.error) {
          case 'AUTH_REQUIRED':
            toast.error('Inicia sesión para agregar al carrito');
            router.push(`/login?next=/products/${slug}`);
            return;
          case 'OUT_OF_STOCK':
            toast.error('No hay suficiente stock disponible');
            return;
          case 'NOT_FOUND':
            toast.error('Este producto ya no está disponible');
            return;
          case 'INVALID_INPUT':
            toast.error('Cantidad inválida');
            return;
          case 'UNKNOWN':
          default:
            toast.error('No pudimos agregar el producto. Intenta de nuevo.');
            return;
        }
      }

      toast.success('Producto agregado al carrito');
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      aria-label="Agregar producto al carrito"
    >
      <input type="hidden" name="productId" value={productId} />
      <QuantityStepper name="quantity" max={maxQuantity} disabled={isPending} />
      <Button
        type="submit"
        size="lg"
        className={cn('flex-1', optimisticAdded && 'bg-primary/90')}
        disabled={isPending}
        aria-label={`Agregar al carrito`}
      >
        {optimisticAdded ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Agregado
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Agregar al carrito
          </>
        )}
      </Button>
    </form>
  );
}

/**
 * Controlled quantity stepper. The +/- buttons emit the new value into
 * a hidden input that the form serializes. The + button is disabled at
 * `max` so the client never sends a quantity larger than stock.
 */
function QuantityStepper({
  name,
  max,
  disabled,
}: {
  name: string;
  max: number;
  disabled: boolean;
}) {
  return (
    <div className="border-border/60 flex items-center rounded-md border">
      <button
        type="button"
        data-step="dec"
        aria-label="Disminuir cantidad"
        className="h-11 w-11 text-lg transition-opacity hover:opacity-80 disabled:opacity-50"
        onClick={(e) => stepFromButton(e, name, -1, 1)}
        disabled={disabled}
      >
        −
      </button>
      <input
        type="number"
        name={name}
        defaultValue={1}
        min={1}
        max={max}
        step={1}
        required
        aria-label="Cantidad"
        className="border-border/60 h-11 w-14 border-x bg-transparent text-center text-sm font-medium tabular-nums focus:outline-none"
        onChange={(e) => clampQuantity(e, max)}
        disabled={disabled}
      />
      <button
        type="button"
        data-step="inc"
        aria-label="Aumentar cantidad"
        className="h-11 w-11 text-lg transition-opacity hover:opacity-80 disabled:opacity-50"
        onClick={(e) => stepFromButton(e, name, 1, max)}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
}

function clampQuantity(event: React.ChangeEvent<HTMLInputElement>, max: number) {
  const value = Number.parseInt(event.target.value, 10);
  if (!Number.isInteger(value) || value < 1) {
    event.target.value = '1';
  } else if (value > max) {
    event.target.value = String(max);
  }
}

function stepFromButton(
  event: React.MouseEvent<HTMLButtonElement>,
  name: string,
  delta: number,
  bound: number,
) {
  const form = event.currentTarget.form;
  if (!form) return;
  const input = form.elements.namedItem(name) as HTMLInputElement | null;
  if (!input) return;
  const current = Number.parseInt(input.value, 10) || 1;
  const next = delta > 0 ? Math.min(bound, current + 1) : Math.max(1, current - 1);
  input.value = String(next);
}
