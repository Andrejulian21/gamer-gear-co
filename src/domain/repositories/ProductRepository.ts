import { Product, CreateProductInput } from '../entities/Product';

export interface ListProductsFilters {
  brandId?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findMany(filters: ListProductsFilters): Promise<Product[]>;
  create(productData: CreateProductInput): Promise<Product>;
  update(id: string, data: Partial<CreateProductInput>): Promise<Product>;
  delete(id: string): Promise<void>;
  count(filters: Omit<ListProductsFilters, 'limit' | 'offset'>): Promise<number>;
  /**
   * Find products with stock below `threshold`, sorted ascending by
   * stock (most depleted first) and capped at 20. Used by the admin
   * dashboard's "low stock" tile.
   */
  findLowStock(threshold: number): Promise<Product[]>;
}
