import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import {
  ProductNotFoundError,
  InsufficientStockError,
  InvalidCartItemQuantityError,
} from '@/domain/errors/CartErrors';

export const UpdateCartItemQuantityInputSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().nonnegative('Quantity must be a non-negative integer'),
});

export type UpdateCartItemQuantityInput = z.infer<typeof UpdateCartItemQuantityInputSchema>;

export interface UpdateCartItemQuantityDeps {
  cartRepository: CartRepository;
  productRepository: ProductRepository;
}

/**
 * Update the quantity of a specific item in the user's cart.
 *
 * Validates:
 * - quantity is a non-negative integer
 *   - quantity === 0 → item is removed from the cart
 *   - quantity > 0 → item quantity is set to the new value
 * - the product exists
 * - requested quantity does not exceed product.stock
 */
export const updateCartItemQuantity = async (
  input: UpdateCartItemQuantityInput,
  deps: UpdateCartItemQuantityDeps,
): Promise<void> => {
  const parsed = UpdateCartItemQuantityInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidCartItemQuantityError(input.quantity);
  }

  const { userId, productId, quantity } = parsed.data;

  const product = await deps.productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  if (quantity > 0 && product.stock < quantity) {
    throw new InsufficientStockError(productId, quantity, product.stock);
  }

  if (quantity === 0) {
    await deps.cartRepository.removeItem(userId, productId);
    return;
  }

  await deps.cartRepository.updateQuantity(userId, productId, quantity);
};
