import { describe, it, expect } from 'vitest';
import { listUserOrders } from '../ListUserOrders';
import { createMockOrderRepository } from '@/domain/__tests__/mocks';
import type { Order } from '@/domain/entities/Order';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'product-1', quantity: 1, price: 50 }],
  total: 50,
  status: 'PENDING',
  wompiReference: 'ref-1',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
  ...overrides,
});

describe('listUserOrders', () => {
  it('returns orders for the user, sorted by createdAt desc (newest first)', async () => {
    const orderRepo = createMockOrderRepository();

    const older = await orderRepo.create(makeOrder({ id: 'order-1', userId: 'user-1' }));
    // Advance real time so the mock (which hardcodes `new Date()`) gives
    // the second order a strictly-later createdAt.
    await new Promise((r) => setTimeout(r, 5));
    const newer = await orderRepo.create(makeOrder({ id: 'order-2', userId: 'user-1' }));

    const result = await listUserOrders({ userId: 'user-1' }, { orderRepository: orderRepo });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(newer.id);
    expect(result[1].id).toBe(older.id);
  });

  it('returns [] when the user has no orders', async () => {
    const orderRepo = createMockOrderRepository();

    const result = await listUserOrders(
      { userId: 'user-with-no-orders' },
      { orderRepository: orderRepo },
    );

    expect(result).toEqual([]);
  });

  it("does not return other users' orders", async () => {
    const orderRepo = createMockOrderRepository();
    await orderRepo.create(makeOrder({ id: 'order-1', userId: 'user-1' }));
    await orderRepo.create(makeOrder({ id: 'order-2', userId: 'user-1' }));
    await orderRepo.create(makeOrder({ id: 'order-3', userId: 'user-2' }));

    const result = await listUserOrders({ userId: 'user-1' }, { orderRepository: orderRepo });

    expect(result).toHaveLength(2);
    expect(result.every((o) => o.userId === 'user-1')).toBe(true);
  });
});
