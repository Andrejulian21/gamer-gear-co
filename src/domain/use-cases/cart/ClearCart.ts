import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';

export const ClearCartInputSchema = z.object({
  userId: z.string().min(1),
});

export type ClearCartInput = z.infer<typeof ClearCartInputSchema>;

export interface ClearCartDeps {
  cartRepository: CartRepository;
}

/**
 * Remove all items from the user's cart.
 *
 * The repository's `clear` operation is scoped to the user (not a global wipe).
 */
export const clearCart = async (input: ClearCartInput, deps: ClearCartDeps): Promise<void> => {
  const parsed = ClearCartInputSchema.parse(input);
  await deps.cartRepository.clear(parsed.userId);
};
