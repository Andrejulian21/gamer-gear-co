import { z } from 'zod';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';

const deleteInputSchema = z.object({
  productId: z.string().min(1),
});

export type DeleteProductInput = z.infer<typeof deleteInputSchema>;

export interface DeleteProductDeps {
  productRepository: ProductRepository;
}

/**
 * Thrown by `deleteProduct` when the product id does not exist.
 * (We check up-front to give the admin a clear error — the repository's
 * `delete` is silent for unknown ids in some implementations.)
 */
export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product with id "${productId}" not found`);
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Admin use case: delete an existing product by id.
 *
 * Throws ProductNotFoundError when the product does not exist.
 */
export const deleteProduct = async (
  input: DeleteProductInput,
  deps: DeleteProductDeps,
): Promise<void> => {
  const parsed = deleteInputSchema.parse(input);
  const { productId } = parsed;

  const existing = await deps.productRepository.findById(productId);
  if (!existing) {
    throw new ProductNotFoundError(productId);
  }

  await deps.productRepository.delete(productId);
};
