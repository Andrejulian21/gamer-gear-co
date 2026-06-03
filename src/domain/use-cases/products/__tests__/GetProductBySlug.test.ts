import { describe, it, expect } from 'vitest';
import { getProductBySlug, ProductNotFoundError } from '../GetProductBySlug';
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

describe('getProductBySlug', () => {
  it('returns the product when found', async () => {
    const productRepo = createMockProductRepository();
    await productRepo.create(sampleProduct());

    const product = await getProductBySlug('mechanical-keyboard', {
      productRepository: productRepo,
    });

    expect(product.id).toBe('prod-1');
    expect(product.slug).toBe('mechanical-keyboard');
    expect(productRepo.findBySlug).toHaveBeenCalledWith('mechanical-keyboard');
  });

  it('throws ProductNotFoundError when product is not found', async () => {
    const productRepo = createMockProductRepository();

    await expect(
      getProductBySlug('does-not-exist', { productRepository: productRepo }),
    ).rejects.toThrow(ProductNotFoundError);
  });
});
