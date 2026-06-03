'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { useCartCount } from '@/presentation/hooks/use-cart-count';
import { removeFromCartAction, updateQuantityAction } from '@/app/(shop)/cart/actions';
import { formatCOP } from '@/presentation/lib/price-format';
import { cn } from '@/presentation/lib/utils';

export interface CartItemView {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  stock: number;
  quantity: number;
}

interface CartItemRowProps {
  item: CartItemView;
  initialCartCount: number;
}

type RowState = { quantity: number };

/**
 * A single line in the cart page.
 *
 * - Quantity stepper is hard-capped at the product's current stock.
 *   The + button is disabled at the cap (D6 client-side guard).
 * - `useOptimistic` flips the quantity immediately; the server action
 *   reconciles via revalidatePath.
 * - The navbar badge is bumped via `useCartCount` (event-broadcast).
 * - Removing the item dispatches a decrement of the full quantity and
 *   optimistically hides the row.
 */
export function CartItemRow({ item, initialCartCount }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticQty, applyOptimistic] = useOptimistic<RowState, { type: 'set'; value: number }>(
    { quantity: item.quantity },
    (state, action) => (action.type === 'set' ? { quantity: action.value } : state),
  );
  const cartCount = useCartCount(initialCartCount);

  const lineTotal = item.unitPrice * optimisticQty.quantity;
  const atMax = optimisticQty.quantity >= item.stock;

  function dispatchQuantity(nextQty: number) {
    if (nextQty < 1) return;
    if (nextQty > item.stock) {
      toast.error(`Solo hay ${item.stock} unidades disponibles`);
      return;
    }
    const delta = nextQty - optimisticQty.quantity;
    if (delta === 0) return;

    startTransition(async () => {
      applyOptimistic({ type: 'set', value: nextQty });
      if (delta > 0) cartCount.increment(delta);
      else cartCount.decrement(-delta);

      const formData = new FormData();
      formData.set('productId', item.productId);
      formData.set('quantity', String(nextQty));

      const result = await updateQuantityAction(formData);

      if (!result.ok) {
        // Roll back optimistic deltas.
        if (delta > 0) cartCount.decrement(delta);
        else cartCount.increment(-delta);
        applyOptimistic({ type: 'set', value: item.quantity });

        switch (result.error) {
          case 'AUTH_REQUIRED':
            toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
            return;
          case 'OUT_OF_STOCK':
            toast.error(`Solo hay ${item.stock} unidades disponibles`);
            return;
          case 'INVALID_INPUT':
            toast.error('Cantidad inválida');
            return;
          default:
            toast.error('No pudimos actualizar la cantidad');
            return;
        }
      }
    });
  }

  function dispatchRemove() {
    const removedQty = optimisticQty.quantity;
    startTransition(async () => {
      cartCount.decrement(removedQty);

      const formData = new FormData();
      formData.set('productId', item.productId);

      const result = await removeFromCartAction(formData);

      if (!result.ok) {
        cartCount.increment(removedQty);
        if (result.error === 'AUTH_REQUIRED') {
          toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
        } else {
          toast.error('No pudimos eliminar el producto');
        }
      } else {
        toast.success('Producto eliminado del carrito');
      }
    });
  }

  return (
    <li className={cn('flex items-start gap-4 py-4 transition-opacity', isPending && 'opacity-60')}>
      <Link
        href={`/products/${item.slug}`}
        aria-label={`Ver ${item.name}`}
        className="border-border/60 relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md border bg-muted"
      >
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes="60px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/products/${item.slug}`}
          className="line-clamp-1 text-sm font-medium hover:underline"
        >
          {item.name}
        </Link>
        <p className="text-xs text-muted-foreground">{formatCOP(item.unitPrice)} c/u</p>

        <div className="mt-2 flex items-center gap-3">
          <div className="border-border/60 flex items-center rounded-md border">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              className="h-8 w-8 text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
              onClick={() => dispatchQuantity(optimisticQty.quantity - 1)}
              disabled={isPending || optimisticQty.quantity <= 1}
            >
              <Minus className="mx-auto h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span
              aria-live="polite"
              aria-label={`Cantidad: ${optimisticQty.quantity}`}
              className="w-8 text-center text-sm font-medium tabular-nums"
            >
              {optimisticQty.quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              className="h-8 w-8 text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
              onClick={() => dispatchQuantity(optimisticQty.quantity + 1)}
              disabled={isPending || atMax}
            >
              <Plus className="mx-auto h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={dispatchRemove}
            disabled={isPending}
            aria-label="Eliminar del carrito"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>
      </div>

      <div className="text-right">
        <p className="font-display text-base font-semibold tabular-nums">{formatCOP(lineTotal)}</p>
      </div>
    </li>
  );
}
