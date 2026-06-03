import { describe, it, expect } from 'vitest';
import { updateProduct, NotFoundError } from '../UpdateProduct';
import { createMockProductRepository } from '@/domain/__tests__/mocks';
import type { Product } from '@/domain/entities/Product';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
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

describe('updateProduct (admin)', () => {
  it('updates an existing product and returns the updated record', async () => {
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'prod-1' }));

    const updated = await updateProduct(
      { productId: 'prod-1', data: { stock: 25, price: 99.5 } },
      { productRepository: productRepo },
    );

    expect(updated.id).toBe('prod-1');
    expect(updated.stock).toBe(25);
    expect(updated.price).toBe(99.5);
    expect(productRepo.update).toHaveBeenCalledWith('prod-1', { stock: 25, price: 99.5 });
  });

  it('throws NotFoundError when the product does not exist', async () => {
    const productRepo = createMockProductRepository();

    await expect(
      updateProduct(
        { productId: 'missing', data: { stock: 1 } },
        { productRepository: productRepo },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('does not call the repository update when the product is missing', async () => {
    const productRepo = createMockProductRepository();

    await expect(
      updateProduct(
        { productId: 'missing', data: { stock: 1 } },
        { productRepository: productRepo },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(productRepo.update).not.toHaveBeenCalled();
  });
});
