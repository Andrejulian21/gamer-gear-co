import { z } from 'zod';
import type { OrderRepository, OrderListFilters } from '@/domain/repositories/OrderRepository';
import type { Order } from '@/domain/entities/Order';
import { OrderStatusSchema } from '@/domain/entities/OrderStatus';

export const ListUserOrdersInputSchema = z.object({
  userId: z.string().min(1),
  status: OrderStatusSchema.optional(),
});

export type ListUserOrdersInput = z.infer<typeof ListUserOrdersInputSchema>;

export interface ListUserOrdersDeps {
  orderRepository: OrderRepository;
}

/**
 * List all orders placed by a given user, sorted by createdAt desc
 * (newest first). The repository is responsible for the WHERE
 * userId = ? (and optional status) filter; the use case guarantees
 * the sort order and validates the inputs through the zod schema.
 */
export const listUserOrders = async (
  input: ListUserOrdersInput,
  deps: ListUserOrdersDeps,
): Promise<Order[]> => {
  const parsed = ListUserOrdersInputSchema.parse(input);
  const filters: OrderListFilters = parsed.status ? { status: parsed.status } : {};
  const orders = await deps.orderRepository.findByUserId(parsed.userId, filters);
  return [...orders].sort((a, b) => {
    const ta = a.createdAt?.getTime() ?? 0;
    const tb = b.createdAt?.getTime() ?? 0;
    return tb - ta;
  });
};
