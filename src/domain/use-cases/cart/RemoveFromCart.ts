import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';

export const RemoveFromCartInputSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
});

export type RemoveFromCartInput = z.infer<typeof RemoveFromCartInputSchema>;

export interface RemoveFromCartDeps {
  cartRepository: CartRepository;
}

/**
 * Remove an item from the user's cart.
 *
 * Idempotent: removing a non-existent product is a no-op (the repository
 * implementation may choose to throw or silently succeed; this use case
 * promises silent success).
 */
export const removeFromCart = async (
  input: RemoveFromCartInput,
  deps: RemoveFromCartDeps,
): Promise<void> => {
  const parsed = RemoveFromCartInputSchema.parse(input);
  await deps.cartRepository.removeItem(parsed.userId, parsed.productId);
};
