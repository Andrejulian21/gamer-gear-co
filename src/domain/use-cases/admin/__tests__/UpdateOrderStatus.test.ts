import { describe, it, expect } from 'vitest';
import { updateOrderStatus } from '../UpdateOrderStatus';
import { createMockOrderRepository } from '@/domain/__tests__/mocks';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import { InvalidStatusTransitionError } from '@/domain/errors/AdminErrors';
import { OrderStatus } from '@/domain/entities/OrderStatus';
import type { Order } from '@/domain/entities/Order';

const makeOrder = (status: OrderStatus): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'product-1', quantity: 1, price: 50 }],
  total: 50,
  status,
  wompiReference: 'ref-1',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
});

describe('updateOrderStatus (admin)', () => {
  describe('allowed transitions', () => {
    it('PENDING -> CANCELLED works', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PENDING));

      const updated = await updateOrderStatus(
        { orderId: 'order-1', newStatus: OrderStatus.CANCELLED },
        { orderRepository: orderRepo },
      );

      expect(updated.status).toBe(OrderStatus.CANCELLED);
    });

    it('PENDING -> FAILED works', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PENDING));

      const updated = await updateOrderStatus(
        { orderId: 'order-1', newStatus: OrderStatus.FAILED },
        { orderRepository: orderRepo },
      );

      expect(updated.status).toBe(OrderStatus.FAILED);
    });

    it('PAID -> SHIPPED works', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PAID));

      const updated = await updateOrderStatus(
        { orderId: 'order-1', newStatus: OrderStatus.SHIPPED },
        { orderRepository: orderRepo },
      );

      expect(updated.status).toBe(OrderStatus.SHIPPED);
    });

    it('SHIPPED -> DELIVERED works', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.SHIPPED));

      const updated = await updateOrderStatus(
        { orderId: 'order-1', newStatus: OrderStatus.DELIVERED },
        { orderRepository: orderRepo },
      );

      expect(updated.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('blocked transitions', () => {
    it('PENDING -> PAID is blocked (only payment webhook can mark PAID)', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PENDING));

      await expect(
        updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.PAID },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    });

    it('PENDING -> DELIVERED is blocked', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PENDING));

      await expect(
        updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.DELIVERED },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    });

    it('PAID -> CANCELLED is blocked (cannot cancel after payment)', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PAID));

      await expect(
        updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.CANCELLED },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    });

    it('PAID -> FAILED is blocked', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PAID));

      await expect(
        updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.FAILED },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    });

    it('SHIPPED -> CANCELLED is blocked', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.SHIPPED));

      await expect(
        updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.CANCELLED },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
    });
  });

  describe('terminal states', () => {
    it('DELIVERED blocks every transition', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.DELIVERED));

      for (const to of Object.values(OrderStatus)) {
        await expect(
          updateOrderStatus({ orderId: 'order-1', newStatus: to }, { orderRepository: orderRepo }),
        ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      }
    });

    it('CANCELLED blocks every transition', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.CANCELLED));

      for (const to of Object.values(OrderStatus)) {
        await expect(
          updateOrderStatus({ orderId: 'order-1', newStatus: to }, { orderRepository: orderRepo }),
        ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      }
    });

    it('FAILED blocks every transition', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.FAILED));

      for (const to of Object.values(OrderStatus)) {
        await expect(
          updateOrderStatus({ orderId: 'order-1', newStatus: to }, { orderRepository: orderRepo }),
        ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      }
    });
  });

  describe('error reporting', () => {
    it('throws OrderNotFoundError when the order is missing', async () => {
      const orderRepo = createMockOrderRepository();

      await expect(
        updateOrderStatus(
          { orderId: 'missing', newStatus: OrderStatus.SHIPPED },
          { orderRepository: orderRepo },
        ),
      ).rejects.toBeInstanceOf(OrderNotFoundError);
    });

    it('InvalidStatusTransitionError carries from and to', async () => {
      const orderRepo = createMockOrderRepository();
      await orderRepo.create(makeOrder(OrderStatus.PENDING));

      try {
        await updateOrderStatus(
          { orderId: 'order-1', newStatus: OrderStatus.SHIPPED },
          { orderRepository: orderRepo },
        );
        throw new Error('expected to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidStatusTransitionError);
        const e = err as InvalidStatusTransitionError;
        expect(e.from).toBe(OrderStatus.PENDING);
        expect(e.to).toBe(OrderStatus.SHIPPED);
      }
    });
  });
});
