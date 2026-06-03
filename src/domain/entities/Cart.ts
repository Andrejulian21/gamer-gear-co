import { z } from 'zod';
import Decimal from 'decimal.js';
import type { CartItem } from './CartItem';
import { InvalidCartItemQuantityError, CartItemNotFoundError } from '../errors/CartErrors';

/**
 * Cart aggregate root.
 *
 * Pure domain entity — NO `name`, `image`, `price`. The presentation layer
 * enriches the aggregate with product display data (see decision D3).
 *
 * All mutating methods return a NEW Cart instance (immutability).
 */
export const CartSchema = z.object({
  userId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().nonnegative(),
    }),
  ),
});

export type Cart = z.infer<typeof CartSchema>;

export interface CreateCartInput {
  userId: string;
  items?: ReadonlyArray<{ productId: string; quantity: number }>;
}

export const createCart = (input: CreateCartInput): Cart => {
  if (!input.userId || input.userId.length === 0) {
    throw new Error('Cart userId must not be empty');
  }

  const items = (input.items ?? []).map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 0) {
      throw new InvalidCartItemQuantityError(item.quantity);
    }
    return { productId: item.productId, quantity: item.quantity };
  });

  // Deduplicate by productId, summing quantities. The first occurrence wins.
  const seen = new Map<string, { productId: string; quantity: number }>();
  for (const item of items) {
    const existing = seen.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      seen.set(item.productId, { ...item });
    }
  }

  return CartSchema.parse({
    userId: input.userId,
    items: Array.from(seen.values()),
  });
};

/**
 * Add an item to the cart. If the product already exists, quantities are summed.
 * Returns a new Cart (immutable).
 */
export const addItem = (cart: Cart, productId: string, quantity: number): Cart => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidCartItemQuantityError(quantity);
  }

  const existing = cart.items.find((i) => i.productId === productId);
  const items = existing
    ? cart.items.map((i) =>
        i.productId === productId ? { productId, quantity: i.quantity + quantity } : i,
      )
    : [...cart.items, { productId, quantity }];

  return { ...cart, items };
};

/**
 * Update the quantity of an item in the cart. Quantity must be >= 0.
 * - quantity > 0 → replace
 * - quantity === 0 → remove the item
 * Returns a new Cart.
 * Throws CartItemNotFoundError if the product is not in the cart.
 */
export const updateItemQuantity = (cart: Cart, productId: string, quantity: number): Cart => {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new InvalidCartItemQuantityError(quantity);
  }

  const existing = cart.items.find((i) => i.productId === productId);
  if (!existing) {
    throw new CartItemNotFoundError(productId);
  }

  if (quantity === 0) {
    return removeItem(cart, productId);
  }

  const items = cart.items.map((i) => (i.productId === productId ? { productId, quantity } : i));
  return { ...cart, items };
};

/**
 * Remove an item from the cart. Returns a new Cart.
 * Idempotent: removing a non-existent product is a no-op.
 */
export const removeItem = (cart: Cart, productId: string): Cart => {
  const items = cart.items.filter((i) => i.productId !== productId);
  return { ...cart, items };
};

/**
 * Remove all items from the cart. Returns a new empty Cart.
 */
export const clear = (cart: Cart): Cart => {
  return { ...cart, items: [] };
};

/**
 * Get the total number of items in the cart (sum of all quantities).
 */
export const getTotalItems = (cart: Cart): number => {
  return cart.items.reduce((acc, i) => acc + i.quantity, 0);
};

/**
 * Price lookup function: given a productId, returns its price as a Decimal
 * or null if the product is unavailable (e.g. deleted, out of stock and
 * filtered out by the caller).
 */
export type PriceLookup = (productId: string) => Decimal | null;

/**
 * Calculate the cart subtotal. Pure function — no I/O, no repository calls.
 *
 * `priceLookup` is the caller's responsibility (typically a Map<productId, Decimal>
 * built from a `ProductRepository.findMany` call).
 *
 * Items whose product has no available price are SKIPPED (treated as unavailable).
 * This prevents the cart from charging for a product that no longer exists.
 */
export const calculateSubtotal = (cart: Cart, priceLookup: PriceLookup): Decimal => {
  return cart.items.reduce((acc, item) => {
    const price = priceLookup(item.productId);
    if (price === null) return acc;
    return acc.plus(price.times(item.quantity));
  }, new Decimal(0));
};

/**
 * Convert a Cart to a flat array of CartItem domain objects (with `id`,
 * `userId`, `productId`, `quantity`). Useful for persistence or
 * presentation that needs the full entity.
 *
 * The `id` is deterministic: derived from `userId + productId`. This matches
 * the unique constraint `@@unique([userId, productId])` in the Prisma schema.
 */
export const toCartItems = (cart: Cart): CartItem[] => {
  return cart.items.map((item) => ({
    id: `${cart.userId}:${item.productId}`,
    userId: cart.userId,
    productId: item.productId,
    quantity: item.quantity,
  }));
};
