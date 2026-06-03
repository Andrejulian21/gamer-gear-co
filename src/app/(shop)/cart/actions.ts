'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/infrastructure/auth/auth';
import { getCartDeps } from '@/presentation/lib/cart-deps';
import {
  InvalidCartItemQuantityError,
  InsufficientStockError,
  ProductNotFoundError,
} from '@/domain/errors/CartErrors';

/**
 * Common shape returned by every cart server action.
 *
 * - `ok: true` on success (no payload — the UI re-reads the page)
 * - `ok: false` with a string error code the client can branch on
 *
 * `AUTH_REQUIRED` is special: the client uses it to redirect to
 * `/login?next=...` instead of surfacing a toast.
 */
export type CartErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_INPUT'
  | 'OUT_OF_STOCK'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export type CartActionResult = { ok: true } | { ok: false; error: CartErrorCode };

function fail(error: CartErrorCode): CartActionResult {
  return { ok: false, error };
}

function mapDomainError(err: unknown): CartActionResult {
  if (err instanceof InvalidCartItemQuantityError) return fail('INVALID_INPUT');
  if (err instanceof InsufficientStockError) return fail('OUT_OF_STOCK');
  if (err instanceof ProductNotFoundError) return fail('NOT_FOUND');
  // zod errors and others
  return fail('UNKNOWN');
}

/**
 * Add an item to the authenticated user's cart.
 *
 * FormData contract:
 *   - productId: string
 *   - quantity:  string (parsed as positive integer)
 */
export async function addToCartAction(formData: FormData): Promise<CartActionResult> {
  const session = await auth();
  if (!session?.user?.id) return fail('AUTH_REQUIRED');

  const productId = String(formData.get('productId') ?? '').trim();
  const quantityRaw = String(formData.get('quantity') ?? '').trim();
  const quantity = Number.parseInt(quantityRaw, 10);

  if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
    return fail('INVALID_INPUT');
  }

  try {
    await getCartDeps().addItemToCart({ userId: session.user.id, productId, quantity });
  } catch (err) {
    return mapDomainError(err);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Remove an item from the authenticated user's cart.
 *
 * FormData contract:
 *   - productId: string
 */
export async function removeFromCartAction(formData: FormData): Promise<CartActionResult> {
  const session = await auth();
  if (!session?.user?.id) return fail('AUTH_REQUIRED');

  const productId = String(formData.get('productId') ?? '').trim();
  if (!productId) return fail('INVALID_INPUT');

  try {
    await getCartDeps().removeFromCart({ userId: session.user.id, productId });
  } catch (err) {
    return mapDomainError(err);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Update the quantity of a specific item in the authenticated user's cart.
 *
 * Setting quantity to 0 removes the item entirely.
 *
 * FormData contract:
 *   - productId: string
 *   - quantity:  string (parsed as non-negative integer)
 */
export async function updateQuantityAction(formData: FormData): Promise<CartActionResult> {
  const session = await auth();
  if (!session?.user?.id) return fail('AUTH_REQUIRED');

  const productId = String(formData.get('productId') ?? '').trim();
  const quantityRaw = String(formData.get('quantity') ?? '').trim();
  const quantity = Number.parseInt(quantityRaw, 10);

  if (!productId || !Number.isInteger(quantity) || quantity < 0) {
    return fail('INVALID_INPUT');
  }

  try {
    await getCartDeps().updateCartItemQuantity({
      userId: session.user.id,
      productId,
      quantity,
    });
  } catch (err) {
    return mapDomainError(err);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Empty the authenticated user's cart entirely.
 */
export async function clearCartAction(): Promise<CartActionResult> {
  const session = await auth();
  if (!session?.user?.id) return fail('AUTH_REQUIRED');

  try {
    await getCartDeps().clearCart({ userId: session.user.id });
  } catch (err) {
    return mapDomainError(err);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
