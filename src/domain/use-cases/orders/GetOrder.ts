import { z } from 'zod';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import type { Order } from '@/domain/entities/Order';
import type { Role } from '@/domain/entities/Role';

export const GetOrderInputSchema = z.object({
  orderId: z.string().min(1),
  requestingUserId: z.string().min(1),
  userRole: z.enum(['USER', 'ADMIN']),
});

export type GetOrderInput = z.infer<typeof GetOrderInputSchema>;

export interface GetOrderDeps {
  orderRepository: OrderRepository;
}

/**
 * Fetch an order by id, enforcing ownership / admin visibility.
 *
 * Authorization model:
 * - the order's owner can always read it
 * - an ADMIN can read any order
 * - any other USER attempting to read someone else's order gets
 *   OrderNotFoundError — we DO NOT leak the existence of the order
 *   (no 403, no "forbidden" — that would tell an attacker the order id
 *   is valid; they should get the same response as if it didn't exist)
 */
export const getOrder = async (input: GetOrderInput, deps: GetOrderDeps): Promise<Order> => {
  const parsed = GetOrderInputSchema.parse(input);
  const { orderId, requestingUserId, userRole } = parsed;

  const order = await deps.orderRepository.findById(orderId);
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const isOwner = order.userId === requestingUserId;
  const isAdmin: Role = userRole;
  if (!isOwner && isAdmin !== 'ADMIN') {
    throw new OrderNotFoundError(orderId);
  }

  return order;
};
