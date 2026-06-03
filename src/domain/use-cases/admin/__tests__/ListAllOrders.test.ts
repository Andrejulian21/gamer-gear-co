import { describe, it, expect } from 'vitest';
import { listAllOrders } from '../ListAllOrders';
import { createMockOrderRepository } from '@/domain/__tests__/mocks';
import { OrderStatus } from '@/domain/entities/OrderStatus';
import type { Order } from '@/domain/entities/Order';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'product-1', quantity: 1, price: 50 }],
  total: 50,
  status: OrderStatus.PAID,
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

describe('listAllOrders (admin)', () => {
  it('returns page 1 by default', async () => {
    const orderRepo = createMockOrderRepository();
    for (let i = 1; i <= 5; i++) {
      await orderRepo.create(makeOrder({ id: `order-${i}` }));
    }

    const page1 = await listAllOrders({ page: 1, pageSize: 3 }, { orderRepository: orderRepo });

    expect(page1).toHaveLength(3);
    expect(orderRepo.findAllPaginated).toHaveBeenCalledWith({}, { page: 1, pageSize: 3 });
  });

  it('returns page 2 with the remaining items', async () => {
    const orderRepo = createMockOrderRepository();
    for (let i = 1; i <= 5; i++) {
      await orderRepo.create(makeOrder({ id: `order-${i}` }));
    }

    const page2 = await listAllOrders({ page: 2, pageSize: 3 }, { orderRepository: orderRepo });

    expect(page2).toHaveLength(2);
  });

  it('filters by status when provided', async () => {
    const orderRepo = createMockOrderRepository();
    await orderRepo.create(makeOrder({ id: 'a', status: OrderStatus.PAID }));
    await orderRepo.create(makeOrder({ id: 'b', status: OrderStatus.PENDING }));
    await orderRepo.create(makeOrder({ id: 'c', status: OrderStatus.PAID }));

    const paid = await listAllOrders(
      { filters: { status: OrderStatus.PAID }, page: 1, pageSize: 10 },
      { orderRepository: orderRepo },
    );

    expect(paid).toHaveLength(2);
    expect(paid.every((o) => o.status === OrderStatus.PAID)).toBe(true);
  });

  it('returns an empty array when no orders match', async () => {
    const orderRepo = createMockOrderRepository();

    const result = await listAllOrders({ page: 1, pageSize: 20 }, { orderRepository: orderRepo });

    expect(result).toEqual([]);
  });
});
