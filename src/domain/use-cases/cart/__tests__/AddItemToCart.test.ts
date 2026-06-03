import { describe, it, expect } from 'vitest';
import { addItemToCart } from '../AddItemToCart';
import { createMockCartRepository } from '@/domain/__tests__/mocks';

describe('addItemToCart', () => {
  it('adds an item to the cart', async () => {
    const cartRepo = createMockCartRepository();

    const item = await addItemToCart(
      { userId: 'user-1', productId: 'product-1', quantity: 2 },
      { cartRepository: cartRepo },
    );

    expect(item.userId).toBe('user-1');
    expect(item.productId).toBe('product-1');
    expect(item.quantity).toBe(2);
    expect(cartRepo.addItem).toHaveBeenCalledWith('user-1', 'product-1', 2);
  });

  it('throws when quantity is less than 1', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'product-1', quantity: 0 },
        { cartRepository: cartRepo },
      ),
    ).rejects.toThrow(/positive integer/i);
  });

  it('throws when quantity is negative', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'product-1', quantity: -3 },
        { cartRepository: cartRepo },
      ),
    ).rejects.toThrow();
  });

  it('throws when quantity is not an integer', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      addItemToCart(
        { userId: 'user-1', productId: 'product-1', quantity: 1.5 },
        { cartRepository: cartRepo },
      ),
    ).rejects.toThrow();
  });
});
