import { describe, it, expect, vi } from 'vitest';
import { wompiWebhookHandler } from '../wompi-webhook-handler';
import {
  createMockOrderRepository,
  createMockCartRepository,
  createMockProductRepository,
} from '@/domain/__tests__/mocks';
import type { Order } from '@/domain/entities/Order';
import type { PrismaClient } from '@prisma/client';

/**
 * Minimal fake of `prisma.$transaction` used by the handler.
 *
 * We don't care WHAT the transaction client looks like for these
 * tests — we care that:
 *   1. The handler opens a transaction (calls `$transaction`)
 *   2. The callback gets invoked with SOME tx-like object
 *   3. The callback's return value is the handler's return value
 *
 * The real PrismaClient wraps the callback in a database transaction;
 * here we just call the callback synchronously with a recording spy
 * that satisfies the `PrismaTransactionClient` interface.
 *
 * The cast to `Pick<PrismaClient, '$transaction'>` is safe — Prisma's
 * generic transaction signature is far wider than what the handler
 * actually uses, and reproducing it in a mock is not worth the noise.
 */
const createMockPrismaWithTx = () => {
  const tx = {
    product: { update: vi.fn(async () => ({ id: 'p', stock: 0 })) },
    order: { update: vi.fn(async () => ({ id: 'o', status: 'PAID' })) },
    cartItem: { deleteMany: vi.fn(async () => ({ count: 0 })) },
  };
  const $transaction = vi.fn(async <T>(fn: (client: typeof tx) => Promise<T>) => fn(tx));
  const prisma = { $transaction } as unknown as Pick<PrismaClient, '$transaction'>;
  return { prisma, tx, $transaction };
};

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'product-1', quantity: 1, price: 50 }],
  total: 50,
  status: 'PENDING',
  wompiReference: 'ref-123',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
  ...overrides,
});

describe('wompiWebhookHandler', () => {
  it('APPROVED: opens a Prisma transaction and returns ok:true with status PAID', async () => {
    const orderRepository = createMockOrderRepository();
    const productRepository = createMockProductRepository();
    const cartRepository = createMockCartRepository();
    const { prisma, $transaction } = createMockPrismaWithTx();

    const order = await orderRepository.create(makeOrder());

    const result = await wompiWebhookHandler(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository, productRepository, cartRepository, prisma },
    );

    expect($transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, status: 'PAID', wompiReference: order.wompiReference });
  });

  it('DECLINED: returns ok:true with status FAILED', async () => {
    const orderRepository = createMockOrderRepository();
    const productRepository = createMockProductRepository();
    const cartRepository = createMockCartRepository();
    const { prisma } = createMockPrismaWithTx();

    const order = await orderRepository.create(makeOrder());

    const result = await wompiWebhookHandler(
      { wompiReference: order.wompiReference!, paymentStatus: 'DECLINED' },
      { orderRepository, productRepository, cartRepository, prisma },
    );

    expect(result).toEqual({ ok: true, status: 'FAILED', wompiReference: order.wompiReference });
  });

  it('returns ok:false with reason "order_not_found" when reference is unknown (soft-fail, does NOT throw)', async () => {
    const orderRepository = createMockOrderRepository();
    const productRepository = createMockProductRepository();
    const cartRepository = createMockCartRepository();
    const { prisma } = createMockPrismaWithTx();

    const result = await wompiWebhookHandler(
      { wompiReference: 'missing-ref', paymentStatus: 'APPROVED' },
      { orderRepository, productRepository, cartRepository, prisma },
    );

    expect(result).toEqual({ ok: false, reason: 'order_not_found', wompiReference: 'missing-ref' });
  });

  it('rethrows non-OrderNotFoundError errors (e.g. DB outage) so the route can 500', async () => {
    const orderRepository = createMockOrderRepository();
    const productRepository = createMockProductRepository();
    const cartRepository = createMockCartRepository();
    const prisma = {
      $transaction: vi.fn(async () => {
        throw new Error('connection refused');
      }),
    } as unknown as Pick<PrismaClient, '$transaction'>;

    await expect(
      wompiWebhookHandler(
        { wompiReference: 'whatever', paymentStatus: 'APPROVED' },
        { orderRepository, productRepository, cartRepository, prisma },
      ),
    ).rejects.toThrow('connection refused');
  });

  it('idempotent re-delivery: order already PAID, returns ok:true status PAID without opening a write tx', async () => {
    // Pre-seed an already-PAID order. processPaymentResult should
    // early-return it unchanged. The handler should still report PAID.
    const orderRepository = createMockOrderRepository();
    const productRepository = createMockProductRepository();
    const cartRepository = createMockCartRepository();
    const { prisma, tx } = createMockPrismaWithTx();

    const order = await orderRepository.create(makeOrder({ status: 'PAID' }));

    const result = await wompiWebhookHandler(
      { wompiReference: order.wompiReference!, paymentStatus: 'APPROVED' },
      { orderRepository, productRepository, cartRepository, prisma },
    );

    expect(result).toEqual({ ok: true, status: 'PAID', wompiReference: order.wompiReference });
    // No writes happened (use case bailed out before touching tx)
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });
});
