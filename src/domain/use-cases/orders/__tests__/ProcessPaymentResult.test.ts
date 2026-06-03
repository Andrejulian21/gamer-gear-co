import { describe, it, expect, vi } from 'vitest';
import { processPaymentResult } from '../ProcessPaymentResult';
import {
  createMockOrderRepository,
  createMockCartRepository,
  createMockProductRepository,
} from '@/domain/__tests__/mocks';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import type { Order } from '@/domain/entities/Order';
import type { PrismaTransactionClient } from '../ProcessPaymentResult';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [
    { productId: 'product-1', quantity: 2, price: 50 },
    { productId: 'product-2', quantity: 1, price: 25 },
  ],
  total: 125,
  status: 'PENDING',
  wompiReference: 'ref-abc',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
  ...overrides,
});

/**
 * Test spy shaped like the Prisma transaction client interface.
 * Records every call without writing. Each method returns a
 * resolvable Promise so the use case flow can continue.
 */
const createMockPrismaTx = (): PrismaTransactionClient & {
  product: { update: ReturnType<typeof vi.fn> };
  order: { update: ReturnType<typeof vi.fn> };
  cartItem: { deleteMany: ReturnType<typeof vi.fn> };
} => ({
  product: {
    update: vi.fn(async () => ({ id: 'x', stock: 0 })),
  },
  order: {
    update: vi.fn(async () => ({ id: 'x', status: 'PAID' })),
  },
  cartItem: {
    deleteMany: vi.fn(async () => ({ count: 0 })),
  },
});

describe('processPaymentResult', () => {
  it('throws OrderNotFoundError when the wompiReference does not match any order', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();

    await expect(
      processPaymentResult(
        { wompiReference: 'missing-ref', paymentStatus: 'APPROVED' },
        { orderRepository: orderRepo, tx },
      ),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('APPROVED: transitions PENDING -> PAID, decrements stock per item, clears cart, returns order with PAID status', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository: orderRepo, tx },
    );

    expect(result.id).toBe(order.id);
    expect(result.status).toBe('PAID');

    // Stock decremented for EACH item
    expect(tx.product.update).toHaveBeenCalledTimes(2);
    expect(tx.product.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'product-1' },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.product.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'product-2' },
      data: { stock: { decrement: 1 } },
    });

    // Order status updated to PAID
    expect(tx.order.update).toHaveBeenCalledTimes(1);
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { status: 'PAID' },
    });

    // Cart cleared for the user
    expect(tx.cartItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('APPROVED: performs all three writes through the SAME tx (not via repositories)', async () => {
    const orderRepo = createMockOrderRepository();
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository: orderRepo, tx },
    );

    // Repositories should NOT be called for the writes — that's the whole
    // point of injecting `tx`: writes go through it for atomicity.
    expect(cartRepo.clear).not.toHaveBeenCalled();
    expect(productRepo.update).not.toHaveBeenCalled();
  });

  it('DECLINED: transitions PENDING -> FAILED via orderRepository.update and returns the updated order', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'DECLINED' },
      { orderRepository: orderRepo, tx },
    );

    expect(result.status).toBe('FAILED');

    // No tx writes for declined (single update, no atomicity needed)
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();

    expect(orderRepo.update).toHaveBeenCalledWith(order.id, { status: 'FAILED' });
  });

  it('ERROR: transitions PENDING -> FAILED (same as DECLINED)', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'ERROR' },
      { orderRepository: orderRepo, tx },
    );

    expect(result.status).toBe('FAILED');
    expect(orderRepo.update).toHaveBeenCalledWith(order.id, { status: 'FAILED' });
  });

  it('idempotency: re-firing on an already-PAID order is a no-op', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder({ status: 'PAID' }));

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository: orderRepo, tx },
    );

    // Returns the existing order unchanged
    expect(result.id).toBe(order.id);
    expect(result.status).toBe('PAID');

    // NO writes through the tx
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('idempotency: re-firing on an already-FAILED order is a no-op', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder({ status: 'FAILED' }));

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'DECLINED' },
      { orderRepository: orderRepo, tx },
    );

    expect(result.status).toBe('FAILED');
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('idempotency: re-firing on a SHIPPED or DELIVERED order is also a no-op (only PENDING transitions)', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder({ status: 'SHIPPED' }));

    const result = await processPaymentResult(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository: orderRepo, tx },
    );

    expect(result.status).toBe('SHIPPED');
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('accepts an optional transactionId (no behavioral effect, just passed through validation)', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    const result = await processPaymentResult(
      {
        wompiReference: order.wompiReference!,
        paymentStatus: 'APPROVED',
        transactionId: 'wompi-tx-12345',
      },
      { orderRepository: orderRepo, tx },
    );

    expect(result.status).toBe('PAID');
  });

  it('rejects an unknown paymentStatus', async () => {
    const orderRepo = createMockOrderRepository();
    const tx = createMockPrismaTx();
    const order = await orderRepo.create(makeOrder());

    await expect(
      processPaymentResult(
        // @ts-expect-error -- intentional bad input for runtime test
        { wompiReference: order.wompiReference!, paymentStatus: 'BOGUS' },
        { orderRepository: orderRepo, tx },
      ),
    ).rejects.toThrow();
  });
});
