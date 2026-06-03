import { z } from 'zod';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { Product, CreateProductInput } from '@/domain/entities/Product';

const updateInputSchema = z.object({
  productId: z.string().min(1),
  data: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().optional(),
      description: z.string().min(1).optional(),
      price: z.number().positive().optional(),
      stock: z.number().int().nonnegative().optional(),
      images: z.array(z.string()).optional(),
      brandId: z.string().min(1).optional(),
      categoryId: z.string().min(1).optional(),
      featured: z.boolean().optional(),
    })
    .strict(),
});

export type UpdateProductInput = z.infer<typeof updateInputSchema>;

export interface UpdateProductDeps {
  productRepository: ProductRepository;
}

/**
 * Admin use case: update an existing product by id.
 *
 * Throws `NotFoundError` (zod's ZodError is NOT thrown — we use a
 * plain Error with a stable name) when the product does not exist.
 * The `data` payload is validated by zod and passed to the repository.
 */
export class NotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product with id "${productId}" not found`);
    this.name = 'NotFoundError';
  }
}

export const updateProduct = async (
  input: UpdateProductInput,
  deps: UpdateProductDeps,
): Promise<Product> => {
  const parsed = updateInputSchema.parse(input);
  const { productId, data } = parsed;

  const existing = await deps.productRepository.findById(productId);
  if (!existing) {
    throw new NotFoundError(productId);
  }

  // Partial<CreateProductInput> on the repo interface; cast is safe
  // because zod has already validated the shape.
  return deps.productRepository.update(productId, data as Partial<CreateProductInput>);
};
