import { describe, it, expect } from 'vitest';
import { getCart } from '../GetCart';
import { createMockCartRepository } from '@/domain/__tests__/mocks';

describe('getCart', () => {
  it('returns a Cart aggregate built from persisted items', async () => {
    const cartRepo = createMockCartRepository();
    await cartRepo.addItem('user-1', 'product-1', 2);
    await cartRepo.addItem('user-1', 'product-2', 1);

    const cart = await getCart({ userId: 'user-1' }, { cartRepository: cartRepo });

    expect(cart.userId).toBe('user-1');
    expect(cart.items).toHaveLength(2);
    const productIds = cart.items.map((i) => i.productId).sort();
    expect(productIds).toEqual(['product-1', 'product-2']);
    const byId = new Map(cart.items.map((i) => [i.productId, i.quantity]));
    expect(byId.get('product-1')).toBe(2);
    expect(byId.get('product-2')).toBe(1);
  });

  it('returns an empty cart when the user has no items', async () => {
    const cartRepo = createMockCartRepository();

    const cart = await getCart({ userId: 'user-1' }, { cartRepository: cartRepo });

    expect(cart.userId).toBe('user-1');
    expect(cart.items).toEqual([]);
  });

  it("does not leak other users' items", async () => {
    const cartRepo = createMockCartRepository();
    await cartRepo.addItem('user-1', 'product-1', 2);
    await cartRepo.addItem('user-2', 'product-2', 1);

    const cart = await getCart({ userId: 'user-1' }, { cartRepository: cartRepo });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('product-1');
  });

  it('rejects an empty userId', async () => {
    const cartRepo = createMockCartRepository();

    await expect(getCart({ userId: '' }, { cartRepository: cartRepo })).rejects.toThrow();
  });
});
