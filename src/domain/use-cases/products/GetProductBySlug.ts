import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { Product } from '@/domain/entities/Product';

export interface GetProductBySlugDeps {
  productRepository: ProductRepository;
}

export class ProductNotFoundError extends Error {
  constructor(public readonly slug: string) {
    super(`Product with slug "${slug}" not found`);
    this.name = 'ProductNotFoundError';
  }
}

export const getProductBySlug = async (
  slug: string,
  deps: GetProductBySlugDeps,
): Promise<Product> => {
  const product = await deps.productRepository.findBySlug(slug);
  if (!product) {
    throw new ProductNotFoundError(slug);
  }
  return product;
};
