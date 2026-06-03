import { describe, it, expect } from 'vitest';
import { clearCart } from '../ClearCart';
import { createMockCartRepository } from '@/domain/__tests__/mocks';

describe('clearCart', () => {
  it('removes all items for the user', async () => {
    const cartRepo = createMockCartRepository();
    await cartRepo.addItem('user-1', 'product-1', 2);
    await cartRepo.addItem('user-1', 'product-2', 1);
    await cartRepo.addItem('user-2', 'product-1', 5);

    await clearCart({ userId: 'user-1' }, { cartRepository: cartRepo });

    const user1Items = await cartRepo.findByUserId('user-1');
    const user2Items = await cartRepo.findByUserId('user-2');
    expect(user1Items).toHaveLength(0);
    expect(user2Items).toHaveLength(1);
    expect(cartRepo.clear).toHaveBeenCalledWith('user-1');
  });

  it('is a no-op when the cart is already empty', async () => {
    const cartRepo = createMockCartRepository();

    await expect(
      clearCart({ userId: 'user-1' }, { cartRepository: cartRepo }),
    ).resolves.toBeUndefined();
  });

  it('rejects an empty userId', async () => {
    const cartRepo = createMockCartRepository();

    await expect(clearCart({ userId: '' }, { cartRepository: cartRepo })).rejects.toThrow();
  });
});
