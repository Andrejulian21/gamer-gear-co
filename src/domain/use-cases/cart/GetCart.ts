import { z } from 'zod';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import { createCart, type Cart } from '@/domain/entities/Cart';

export const GetCartInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetCartInput = z.infer<typeof GetCartInputSchema>;

export interface GetCartDeps {
  cartRepository: CartRepository;
}

/**
 * Load the user's cart and return it as a Cart aggregate.
 *
 * The aggregate is built from the persisted CartItem[] — no product
 * enrichment happens here. The presentation layer joins in product
 * data (name, image, price) for display.
 */
export const getCart = async (input: GetCartInput, deps: GetCartDeps): Promise<Cart> => {
  const parsed = GetCartInputSchema.parse(input);
  const items = await deps.cartRepository.findByUserId(parsed.userId);
  return createCart({
    userId: parsed.userId,
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });
};
