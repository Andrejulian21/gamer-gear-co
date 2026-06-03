'use client';

import { useState, useTransition } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';

interface Props {
  inStock: boolean;
  maxQuantity: number;
}

/**
 * Placeholder add-to-cart button.
 * Real cart logic lives in Phase 3 (Zustand + DB merge on login).
 */
export function AddToCartButton({ inStock, maxQuantity }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!inStock) {
    return (
      <Button size="lg" disabled className="w-full" aria-label="Producto agotado">
        Agotado
      </Button>
    );
  }

  const handleAdd = () => {
    startTransition(() => {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="border-border/60 flex items-center rounded-md border">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1 || isPending}
          aria-label="Disminuir cantidad"
          className="h-11 w-11 text-lg disabled:opacity-50"
        >
          −
        </button>
        <span
          aria-live="polite"
          aria-label={`Cantidad: ${quantity}`}
          className="w-10 text-center text-sm font-medium tabular-nums"
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity || isPending}
          aria-label="Aumentar cantidad"
          className="h-11 w-11 text-lg disabled:opacity-50"
        >
          +
        </button>
      </div>
      <Button
        size="lg"
        className="flex-1"
        onClick={handleAdd}
        disabled={isPending}
        aria-label={`Agregar ${quantity} unidad${quantity === 1 ? '' : 'es'} al carrito`}
      >
        {added ? (
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
    </div>
  );
}
