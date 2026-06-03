import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { Order } from '@/domain/entities/Order';
import { OrderStatus } from '@/domain/entities/OrderStatus';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import { InvalidStatusTransitionError } from '@/domain/errors/AdminErrors';

export interface UpdateOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
}

export interface UpdateOrderStatusDeps {
  orderRepository: OrderRepository;
}

/**
 * Allowed admin status transitions. Anything not listed here is
 * blocked.
 *
 *   PENDING  -> {CANCELLED, FAILED}
 *   PAID     -> {SHIPPED}
 *   SHIPPED  -> {DELIVERED}
 *
 * Terminal states (DELIVERED, CANCELLED, FAILED) accept no further
 * transitions and are therefore absent from the table.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  [OrderStatus.PENDING]: new Set([OrderStatus.CANCELLED, OrderStatus.FAILED]),
  [OrderStatus.PAID]: new Set([OrderStatus.SHIPPED]),
  [OrderStatus.SHIPPED]: new Set([OrderStatus.DELIVERED]),
  [OrderStatus.DELIVERED]: new Set(),
  [OrderStatus.CANCELLED]: new Set(),
  [OrderStatus.FAILED]: new Set(),
};

/**
 * Admin use case: transition an order to a new status.
 *
 * Enforces the order lifecycle:
 *   PENDING  -> CANCELLED | FAILED
 *   PAID     -> SHIPPED
 *   SHIPPED  -> DELIVERED
 * Terminal states (DELIVERED, CANCELLED, FAILED) accept no further
 * transitions.
 *
 * Throws:
 *   - OrderNotFoundError if the order id is unknown
 *   - InvalidStatusTransitionError if the transition is not allowed
 *     by the rules above (the error carries `from` and `to` for UI use)
 */
export const updateOrderStatus = async (
  input: UpdateOrderStatusInput,
  deps: UpdateOrderStatusDeps,
): Promise<Order> => {
  const { orderId, newStatus } = input;

  const order = await deps.orderRepository.findById(orderId);
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.has(newStatus)) {
    throw new InvalidStatusTransitionError(order.status, newStatus);
  }

  return deps.orderRepository.update(orderId, { status: newStatus });
};
