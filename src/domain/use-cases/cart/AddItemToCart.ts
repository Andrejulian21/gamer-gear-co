import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { CartItem } from '@/domain/entities/CartItem';
import {
  ProductNotFoundError,
  InsufficientStockError,
  InvalidCartItemQuantityError,
} from '@/domain/errors/CartErrors';

export const AddItemToCartInputSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export type AddItemToCartInput = z.infer<typeof AddItemToCartInputSchema>;

export interface AddItemToCartDeps {
  cartRepository: CartRepository;
  productRepository: ProductRepository;
}

/**
 * Add an item to the user's cart.
 *
 * Validates:
 * - quantity is a positive integer
 * - the product exists
 * - requested quantity does not exceed product.stock
 *
 * On success, the use case delegates to the cart repository's `addItem`
 * (which the infrastructure layer implements as upsert-by-(userId, productId)).
 */
export const addItemToCart = async (
  input: AddItemToCartInput,
  deps: AddItemToCartDeps,
): Promise<CartItem> => {
  const parsed = AddItemToCartInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidCartItemQuantityError(input.quantity);
  }

  const { userId, productId, quantity } = parsed.data;

  const product = await deps.productRepository.findById(productId);
  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  if (product.stock < quantity) {
    throw new InsufficientStockError(productId, quantity, product.stock);
  }

  return deps.cartRepository.addItem(userId, productId, quantity);
};
