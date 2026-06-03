import { describe, it, expect } from 'vitest';
import { addItemToCart } from '../AddItemToCart';
import {
  createMockCartRepository,
  createMockProductRepository,
  createMockAddItemToCartDeps,
} from '@/domain/__tests__/mocks';
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

describe('addItemToCart', () => {
  it('adds an item to the cart when stock is sufficient', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 10 }));

    const item = await addItemToCart(
      { userId: 'user-1', productId: 'product-1', quantity: 2 },
      { cartRepository: cartRepo, productRepository: productRepo },
    );

    expect(item.userId).toBe('user-1');
    expect(item.productId).toBe('product-1');
    expect(item.quantity).toBe(2);
    expect(cartRepo.addItem).toHaveBeenCalledWith('user-1', 'product-1', 2);
  });

  it('throws InvalidCartItemQuantityError when quantity is 0', async () => {
    const deps = createMockAddItemToCartDeps();

    await expect(
      addItemToCart({ userId: 'user-1', productId: 'product-1', quantity: 0 }, deps),
    ).rejects.toThrow(/invalid.*quantity/i);
  });

  it('throws InvalidCartItemQuantityError when quantity is negative', async () => {
    const deps = createMockAddItemToCartDeps();

    await expect(
      addItemToCart({ userId: 'user-1', productId: 'product-1', quantity: -3 }, deps),
    ).rejects.toThrow(/invalid.*quantity/i);
  });

  it('throws InsufficientStockError when product stock is 0', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 0 }));

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'product-1', quantity: 1 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/insufficient stock/i);
  });

  it('throws InsufficientStockError when quantity exceeds stock', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 3 }));

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'product-1', quantity: 5 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/insufficient stock/i);
  });

  it('accepts quantity equal to stock (boundary)', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    await productRepo.create(makeProduct({ id: 'product-1', stock: 5 }));

    const item = await addItemToCart(
      { userId: 'user-1', productId: 'product-1', quantity: 5 },
      { cartRepository: cartRepo, productRepository: productRepo },
    );

    expect(item.quantity).toBe(5);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'missing', quantity: 1 },
        { cartRepository: cartRepo, productRepository: productRepo },
      ),
    ).rejects.toThrow(/not found/i);
  });

  it('rejects non-integer quantity', async () => {
    const deps = createMockAddItemToCartDeps();

    await expect(
      addItemToCart({ userId: 'user-1', productId: 'product-1', quantity: 1.5 }, deps),
    ).rejects.toThrow();
  });
});
