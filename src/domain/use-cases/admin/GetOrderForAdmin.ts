import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { Order } from '@/domain/entities/Order';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';

export interface GetOrderForAdminInput {
  orderId: string;
}

export interface GetOrderForAdminDeps {
  orderRepository: OrderRepository;
}

/**
 * Admin use case: fetch any order by id, with full item hydration.
 *
 * Different from `getOrder` (used by the customer-facing order detail
 * page) in that it does NOT enforce ownership or role checks — admin
 * can read any order. Items are hydrated by the repository via the
 * existing `findById` include.
 *
 * Throws OrderNotFoundError when the order id is unknown.
 */
export const getOrderForAdmin = async (
  input: GetOrderForAdminInput,
  deps: GetOrderForAdminDeps,
): Promise<Order> => {
  const order = await deps.orderRepository.findById(input.orderId);
  if (!order) {
    throw new OrderNotFoundError(input.orderId);
  }
  return order;
};
