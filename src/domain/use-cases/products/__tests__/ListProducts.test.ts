import { describe, it, expect } from 'vitest';
import { listProducts } from '../ListProducts';
import { createMockProductRepository } from '@/domain/__tests__/mocks';
import type { Product } from '@/domain/entities/Product';

const sampleProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Mechanical Keyboard',
  slug: 'mechanical-keyboard',
  description: 'A great keyboard',
  price: 120,
  stock: 10,
  images: ['https://cdn.example.com/kb.png'],
  brandId: 'brand-1',
  categoryId: 'cat-1',
  featured: false,
  ...overrides,
});

describe('listProducts', () => {
  it('returns products from the repository', async () => {
    const productRepo = createMockProductRepository();
    const p1 = sampleProduct();
    const p2 = sampleProduct({ id: 'prod-2', slug: 'mouse' });
    await productRepo.create(p1);
    await productRepo.create(p2);

    const result = await listProducts({}, { productRepository: productRepo });

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id).sort()).toEqual(['prod-1', 'prod-2']);
  });

  it('passes filters to the repository', async () => {
    const productRepo = createMockProductRepository();

    await listProducts(
      {
        brandId: 'brand-1',
        categoryId: 'cat-2',
        search: 'keyboard',
        minPrice: 50,
        maxPrice: 200,
        featured: true,
        limit: 10,
        offset: 0,
      },
      { productRepository: productRepo },
    );

    expect(productRepo.findMany).toHaveBeenCalledWith({
      brandId: 'brand-1',
      categoryId: 'cat-2',
      search: 'keyboard',
      minPrice: 50,
      maxPrice: 200,
      featured: true,
      limit: 10,
      offset: 0,
    });
  });

  it('returns an empty array when no products match', async () => {
    const productRepo = createMockProductRepository();
    const result = await listProducts({ featured: true }, { productRepository: productRepo });
    expect(result).toEqual([]);
  });
});
