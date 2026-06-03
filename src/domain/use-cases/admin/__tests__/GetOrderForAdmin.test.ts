import { describe, it, expect } from 'vitest';
import { getOrderForAdmin } from '../GetOrderForAdmin';
import { createMockOrderRepository } from '@/domain/__tests__/mocks';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import type { Order } from '@/domain/entities/Order';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'product-1', quantity: 1, price: 50 }],
  total: 50,
  status: 'PAID',
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

describe('getOrderForAdmin (admin)', () => {
  it('returns the order with items when found', async () => {
    const orderRepo = createMockOrderRepository();
    await orderRepo.create(makeOrder());

    const result = await getOrderForAdmin({ orderId: 'order-1' }, { orderRepository: orderRepo });

    expect(result.id).toBe('order-1');
    expect(result.items).toHaveLength(1);
  });

  it('throws OrderNotFoundError when the order is missing', async () => {
    const orderRepo = createMockOrderRepository();

    await expect(
      getOrderForAdmin({ orderId: 'missing' }, { orderRepository: orderRepo }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
