'use client';

import { useEffect, useOptimistic } from 'react';

interface CartCountState {
  count: number;
}

type CartCountAction =
  | { type: 'increment'; amount: number }
  | { type: 'decrement'; amount: number }
  | { type: 'set'; value: number };

/**
 * Window event name used to broadcast cart-count mutations between
 * unrelated components (the AddToCartButton deep in the product tree
 * and the NavbarCartCount in the layout).
 *
 * Listeners should call the matching setter from this hook inside a
 * `startTransition` block.
 */
export const CART_COUNT_EVENT = 'gamer-gear-co:cart-count';

interface CartCountEventDetail {
  type: 'increment' | 'decrement' | 'set';
  amount?: number;
  value?: number;
}

/**
 * Optimistic cart count hook.
 *
 * Use in any client component that wants to mutate the navbar badge
 * (AddToCartButton, CartItemRow, etc.) without waiting for the server
 * round-trip. Mutations are broadcast via a `window` CustomEvent so the
 * NavbarCartCount — which lives in a separate component instance —
 * can stay in sync even though it isn't a descendant of the mutator.
 *
 * The actual server action is responsible for the canonical state;
 * `revalidatePath('/', 'layout')` in the action eventually reconciles
 * the badge from the database.
 *
 * Usage:
 *
 *     const cart = useCartCount(initial);
 *     cart.increment(1);  // on "add to cart"
 *     cart.decrement(1);  // on "remove from cart"
 */
export function useCartCount(initial: number) {
  const [optimistic, applyOptimistic] = useOptimistic<CartCountState, CartCountAction>(
    { count: initial },
    (state, action) => {
      switch (action.type) {
        case 'increment':
          return { count: Math.max(0, state.count + action.amount) };
        case 'decrement':
          return { count: Math.max(0, state.count - action.amount) };
        case 'set':
          return { count: Math.max(0, action.value) };
      }
    },
  );

  function emit(detail: CartCountEventDetail) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(CART_COUNT_EVENT, { detail }));
  }

  return {
    count: optimistic.count,
    increment(amount: number) {
      applyOptimistic({ type: 'increment', amount });
      emit({ type: 'increment', amount });
    },
    decrement(amount: number) {
      applyOptimistic({ type: 'decrement', amount });
      emit({ type: 'decrement', amount });
    },
    set(value: number) {
      applyOptimistic({ type: 'set', value });
      emit({ type: 'set', value });
    },
  };
}

/**
 * Hook for the badge to receive cart-count mutations broadcast by
 * other components. Returns the same `useCartCount` shape, but driven
 * by incoming events.
 *
 * Must be called from a component that is a descendant of a React
 * transition boundary (typically `useTransition` in the parent).
 */
export function useCartCountListener(initial: number) {
  const cart = useCartCount(initial);

  useEffect(() => {
    function handler(event: Event) {
      const detail = (event as CustomEvent<CartCountEventDetail>).detail;
      if (!detail) return;
      switch (detail.type) {
        case 'increment':
          if (typeof detail.amount === 'number') cart.increment(detail.amount);
          break;
        case 'decrement':
          if (typeof detail.amount === 'number') cart.decrement(detail.amount);
          break;
        case 'set':
          if (typeof detail.value === 'number') cart.set(detail.value);
          break;
      }
    }
    window.addEventListener(CART_COUNT_EVENT, handler);
    return () => window.removeEventListener(CART_COUNT_EVENT, handler);
    // cart is stable enough — we only care about the event listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cart;
}
