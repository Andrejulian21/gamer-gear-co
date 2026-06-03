import { describe, it, expect } from 'vitest';
import { removeFromCart } from '../RemoveFromCart';
import { createMockCartRepository } from '@/domain/__tests__/mocks';

describe('removeFromCart', () => {
  it('removes an item from the cart and persists', async () => {
    const cartRepo = createMockCartRepository();
    await cartRepo.addItem('user-1', 'product-1', 2);
    await cartRepo.addItem('user-1', 'product-2', 1);

    await removeFromCart(
      { userId: 'user-1', productId: 'product-1' },
      { cartRepository: cartRepo },
    );

    const remaining = await cartRepo.findByUserId('user-1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].productId).toBe('product-2');
    expect(cartRepo.removeItem).toHaveBeenCalledWith('user-1', 'product-1');
  });

  it('is a no-op when the item is not in the cart', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      removeFromCart(
        { userId: 'user-1', productId: 'missing-product' },
        { cartRepository: cartRepo },
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects an empty userId', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      removeFromCart({ userId: '', productId: 'product-1' }, { cartRepository: cartRepo }),
    ).rejects.toThrow();
  });

  it('rejects an empty productId', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      removeFromCart({ userId: 'user-1', productId: '' }, { cartRepository: cartRepo }),
    ).rejects.toThrow();
  });
});
