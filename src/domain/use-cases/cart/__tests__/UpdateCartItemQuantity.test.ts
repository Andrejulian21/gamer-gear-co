import { describe, it, expect } from 'vitest';
import { updateCartItemQuantity } from '../UpdateCartItemQuantity';
import { createMockCartRepository, createMockProductRepository } from '@/domain/__tests__/mocks';
import type { Product } from '@/domain/entities/Product';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Test Mouse',
  slug: 'test-mouse',
  description: 'A great mouse',
  price: 50,
  stock: 10,
  images: [],
  brandId: 'brand-1',
  categoryId: 'category-1',
  featured: false,
  ...overrides,
});

describe('updateCartItemQuantity', () => {
  it('updates the quantity of an existing item', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 2);

    await updateCartItemQuantity(
      { userId: 'user-1', productId: 'product-1', quantity: 5 },
      { cartRepository: cartRepo, productRepository: productRepo },
    );

    const items = await cartRepo.findByUserId('user-1');
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it('throws InsufficientStockError when requested quantity exceeds stock', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 3 }));
    await cartRepo.addItem('user-1', 'product-1', 1);

    await expect(
      updateCartItemQuantity(
        { userId: 'user-1', productId: 'product-1', quantity: 5 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/insufficient stock/i);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();

    await expect(
      updateCartItemQuantity(
        { userId: 'user-1', productId: 'missing', quantity: 1 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/not found/i);
  });

  it('throws InvalidCartItemQuantityError for quantity < 0', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 10 }));

    await expect(
      updateCartItemQuantity(
        { userId: 'user-1', productId: 'product-1', quantity: -1 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/invalid.*quantity/i);
  });

  it('accepts quantity = 0 (removes the item from the cart)', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 3);

    await updateCartItemQuantity(
      { userId: 'user-1', productId: 'product-1', quantity: 0 },
      { cartRepository: cartRepo, productRepository: productRepo },
    );

    const items = await cartRepo.findByUserId('user-1');
    expect(items).toHaveLength(0);
  });

  it('accepts quantity equal to stock (boundary)', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 1);

    await updateCartItemQuantity(
      { userId: 'user-1', productId: 'product-1', quantity: 10 },
      { cartRepository: cartRepo, productRepository: productRepo },
    );

    const items = await cartRepo.findByUserId('user-1');
    expect(items[0].quantity).toBe(10);
  });
});
