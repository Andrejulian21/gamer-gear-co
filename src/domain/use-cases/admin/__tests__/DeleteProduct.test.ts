import { describe, it, expect } from 'vitest';
import { deleteProduct, ProductNotFoundError } from '../DeleteProduct';
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

describe('deleteProduct (admin)', () => {
  it('deletes an existing product', async () => {
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'prod-1' }));

    await deleteProduct({ productId: 'prod-1' }, { productRepository: productRepo });

    expect(productRepo.delete).toHaveBeenCalledWith('prod-1');
    const remaining = await productRepo.findById('prod-1');
    expect(remaining).toBeNull();
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const productRepo = createMockProductRepository();

    await expect(
      deleteProduct({ productId: 'missing' }, { productRepository: productRepo }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('does not call the repository delete when the product is missing', async () => {
    const productRepo = createMockProductRepository();

    await expect(
      deleteProduct({ productId: 'missing' }, { productRepository: productRepo }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);

    expect(productRepo.delete).not.toHaveBeenCalled();
  });
});
