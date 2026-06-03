import { z } from 'zod';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import type { Order } from '@/domain/entities/Order';

export const PaymentStatusSchema = z.enum(['APPROVED', 'DECLINED', 'ERROR']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const ProcessPaymentResultInputSchema = z.object({
  wompiReference: z.string().min(1),
  paymentStatus: PaymentStatusSchema,
  transactionId: z.string().optional(),
});

export type ProcessPaymentResultInput = z.infer<typeof ProcessPaymentResultInputSchema>;

/**
 * Minimal interface for the Prisma transaction client that
 * `processPaymentResult` needs. Defined in the domain layer (no
 * `@prisma/client` import) so the use case stays testable with a
 * plain mock. The real Prisma transaction client (passed by the
 * infrastructure layer via `prisma.$transaction(async (tx) => ...)`)
 * is structurally compatible with this interface.
 *
 * Why an injected `tx` instead of `prisma.$transaction` inside the
 * use case: keeps the use case free of the persistence detail of
 * "how to open a transaction". The infrastructure layer is
 * responsible for opening it; the use case just consumes it.
 */
export interface PrismaTransactionClient {
  product: {
    update(args: {
      where: { id: string };
      data: { stock: { decrement: number } };
    }): Promise<unknown>;
  };
  order: {
    update(args: { where: { id: string }; data: { status: 'PAID' | 'FAILED' } }): Promise<unknown>;
  };
  cartItem: {
    deleteMany(args: { where: { userId: string } }): Promise<unknown>;
  };
}

export interface ProcessPaymentResultDeps {
  orderRepository: OrderRepository;
  tx: PrismaTransactionClient;
}

/**
 * Apply the result of a Wompi payment webhook to the order.
 *
 * Flow:
 *  1. Look up the order by `wompiReference`. Throw if not found.
 *  2. Idempotency: if the order is NOT in PENDING status, return it
 *     unchanged. Wompi may re-fire the webhook; we must not double-process.
 *  3. APPROVED: atomically (via the injected `tx`):
 *       - decrement product.stock for each item
 *       - update order status to PAID
 *       - clear the user's cart
 *     Return the order with status PAID.
 *  4. DECLINED / ERROR: update order status to FAILED via the
 *     repository. Single write, no transaction needed.
 *
 * Stock + status + cart clear MUST be all-or-nothing. If we partial-fail,
 * the order ends up PAID but cart is still full (or worse, stock
 * decremented but status still PENDING). The injected `tx` is the
 * abstraction that makes this safe: in production it is a Prisma
 * transaction, in tests it is a recording mock.
 */
export const processPaymentResult = async (
  input: ProcessPaymentResultInput,
  deps: ProcessPaymentResultDeps,
): Promise<Order> => {
  const parsed = ProcessPaymentResultInputSchema.parse(input);
  const { wompiReference, paymentStatus } = parsed;

  const order = await deps.orderRepository.findByWompiReference(wompiReference);
  if (!order) {
    throw new OrderNotFoundError(wompiReference);
  }

  // Idempotency: only PENDING orders can transition. Any other status
  // (PAID, FAILED, SHIPPED, DELIVERED, CANCELLED) means we've already
  // processed this webhook — return the existing order unchanged.
  if (order.status !== 'PENDING') {
    return order;
  }

  if (paymentStatus === 'APPROVED') {
    // Atomic block: all three writes succeed or none do.
    for (const item of order.items) {
      await deps.tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await deps.tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
    });
    await deps.tx.cartItem.deleteMany({
      where: { userId: order.userId },
    });
    return { ...order, status: 'PAID' };
  }

  // DECLINED or ERROR
  return deps.orderRepository.update(order.id, { status: 'FAILED' });
};
