/**
 * Wompi webhook business-logic handler.
 *
 * This is the seam between the HTTP layer (Next.js route handler at
 * `src/app/api/wompi/webhook/route.ts`) and the domain use case
 * `processPaymentResult`. It owns ONE responsibility: open a Prisma
 * transaction and feed the use case's `tx` dependency.
 *
 * Why a separate handler instead of calling the use case directly from
 * the route?
 *  1. The route should not know about Prisma — it should only translate
 *     HTTP <-> domain. Anything Prisma-shaped (the `$transaction` call)
 *     belongs in the infrastructure layer.
 *  2. Testability: the route can be tested with an HTTP request and the
 *     handler can be unit-tested with mocks, independently.
 *  3. Idempotency lives in the use case, not here. We do NOT re-check
 *     order status before opening the transaction — the use case is the
 *     single source of truth for "is this webhook a no-op?".
 *
 * Error handling:
 *  - `OrderNotFoundError` is caught and logged at WARN. The webhook may
 *    legitimately fire for an order belonging to a different env (e.g.
 *    a sandbox test reference that doesn't exist in production). We do
 *    NOT 500 on this — returning a successful result keeps Wompi from
 *    retrying forever.
 *  - Any other error is rethrown for the route to log and respond 500.
 *  - We NEVER log the full request body (PII risk: customer_email,
 *    transaction.id can be considered sensitive). The route logs only
 *    the event type, the resolved status, and the wompiReference.
 */

import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { PrismaClient } from '@prisma/client';
import {
  processPaymentResult,
  type PaymentStatus,
  type PrismaTransactionClient,
} from '@/domain/use-cases/orders/ProcessPaymentResult';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';

export interface WompiWebhookHandlerInput {
  wompiReference: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
}

export interface WompiWebhookHandlerDeps {
  orderRepository: OrderRepository;
  productRepository: ProductRepository;
  cartRepository: CartRepository;
  prisma: Pick<PrismaClient, '$transaction'>;
}

export type WompiWebhookHandlerResult =
  | { ok: true; status: 'PAID' | 'FAILED' | 'PENDING'; wompiReference: string }
  | { ok: false; reason: 'order_not_found'; wompiReference: string };

/**
 * Apply a Wompi webhook result inside a Prisma transaction.
 *
 * Returns a discriminated union so the route handler can produce a
 * compact, structured log line without surfacing exceptions to Wompi.
 */
export const wompiWebhookHandler = async (
  input: WompiWebhookHandlerInput,
  deps: WompiWebhookHandlerDeps,
): Promise<WompiWebhookHandlerResult> => {
  try {
    const updatedOrder = await deps.prisma.$transaction(async (tx) => {
      // The Prisma transaction client is structurally compatible with
      // our domain-level `PrismaTransactionClient` interface (only the
      // `product.update`, `order.update`, `cartItem.deleteMany` methods
      // are used). The cast is safe and isolates the type leak here.
      return processPaymentResult(input, {
        orderRepository: deps.orderRepository,
        tx: tx as unknown as PrismaTransactionClient,
      });
    });

    // Map domain status -> handler status. PENDING orders that were
    // already processed (PAID/FAILED) are returned by the use case as-is.
    const status =
      updatedOrder.status === 'PAID'
        ? 'PAID'
        : updatedOrder.status === 'FAILED'
          ? 'FAILED'
          : 'PENDING';

    return { ok: true, status, wompiReference: input.wompiReference };
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      // Soft-fail: webhook may be from a different env. Don't 500.
      // The route should log this and return 200 so Wompi stops retrying.
      return { ok: false, reason: 'order_not_found', wompiReference: input.wompiReference };
    }
    throw err;
  }
};
