'use client';

import { useCartCountListener } from '@/presentation/hooks/use-cart-count';
import { cn } from '@/presentation/lib/utils';

interface CartCountBadgeClientProps {
  initial: number;
  className?: string;
}

/**
 * Client subcomponent for the navbar cart badge.
 *
 * Renders nothing when the optimistic count drops to 0, so the badge
 * cleanly disappears after the user removes the last item.
 *
 * Mutations broadcast by AddToCartButton / CartItemRow arrive via a
 * `window` CustomEvent; useCartCountListener applies them through
 * useOptimistic.
 */
export function CartCountBadgeClient({ initial, className }: CartCountBadgeClientProps) {
  const cart = useCartCountListener(initial);

  if (cart.count <= 0) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={
        cart.count === 1 ? '1 producto en el carrito' : `${cart.count} productos en el carrito`
      }
      data-cart-count={cart.count}
      className={cn(
        'inline-flex items-center justify-center rounded-full border-transparent bg-primary px-1.5 text-[10px] font-bold tabular-nums text-primary-foreground',
        className,
      )}
    >
      {cart.count > 99 ? '99+' : cart.count}
    </span>
  );
}
