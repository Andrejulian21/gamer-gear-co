import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { CartItem } from '@/domain/entities/CartItem';

export const AddItemToCartInputSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export type AddItemToCartInput = z.infer<typeof AddItemToCartInputSchema>;

export interface AddItemToCartDeps {
  cartRepository: CartRepository;
}

export const addItemToCart = async (
  input: AddItemToCartInput,
  deps: AddItemToCartDeps,
): Promise<CartItem> => {
  const parsed = AddItemToCartInputSchema.parse(input);
  return deps.cartRepository.addItem(parsed.userId, parsed.productId, parsed.quantity);
};
