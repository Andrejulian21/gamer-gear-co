import type {
  ProductRepository,
  ListProductsFilters,
} from '@/domain/repositories/ProductRepository';
import type { Product } from '@/domain/entities/Product';

export interface ListProductsDeps {
  productRepository: ProductRepository;
}

export const listProducts = async (
  filters: ListProductsFilters,
  deps: ListProductsDeps,
): Promise<Product[]> => {
  return deps.productRepository.findMany(filters);
};
