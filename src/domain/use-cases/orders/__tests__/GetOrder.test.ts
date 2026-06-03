import { describe, it, expect } from 'vitest';
import { getOrder } from '../GetOrder';
import { createMockOrderRepository } from '@/domain/__tests__/mocks';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
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

describe('getOrder', () => {
  it('returns the order when the requesting user is the owner', async () => {
    const orderRepo = createMockOrderRepository();
    const order = await orderRepo.create(makeOrder());

    const result = await getOrder(
      { orderId: order.id, requestingUserId: 'user-1', userRole: 'USER' },
      { orderRepository: orderRepo },
    );

    expect(result.id).toBe(order.id);
    expect(result.userId).toBe('user-1');
  });

  it('returns the order when the requesting user is an admin (even if not the owner)', async () => {
    const orderRepo = createMockOrderRepository();
    const order = await orderRepo.create(makeOrder({ userId: 'user-1' }));

    const result = await getOrder(
      { orderId: order.id, requestingUserId: 'user-99', userRole: 'ADMIN' },
      { orderRepository: orderRepo },
    );

    expect(result.id).toBe(order.id);
  });

  it("throws OrderNotFoundError when another non-admin user requests someone else's order (does not leak existence)", async () => {
    const orderRepo = createMockOrderRepository();
    const order = await orderRepo.create(makeOrder({ userId: 'user-1' }));

    await expect(
      getOrder(
        { orderId: order.id, requestingUserId: 'user-2', userRole: 'USER' },
        { orderRepository: orderRepo },
      ),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    const orderRepo = createMockOrderRepository();

    await expect(
      getOrder(
        { orderId: 'missing', requestingUserId: 'user-1', userRole: 'USER' },
        { orderRepository: orderRepo },
      ),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
