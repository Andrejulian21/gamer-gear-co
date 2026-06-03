import { z } from 'zod';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { Order } from '@/domain/entities/Order';

export const ListUserOrdersInputSchema = z.object({
  userId: z.string().min(1),
});

export type ListUserOrdersInput = z.infer<typeof ListUserOrdersInputSchema>;

export interface ListUserOrdersDeps {
  orderRepository: OrderRepository;
}

/**
 * List all orders placed by a given user, sorted by createdAt desc
 * (newest first). The repository is responsible for the WHERE userId = ?
 * filter; the use case guarantees the sort order.
 */
export const listUserOrders = async (
  input: ListUserOrdersInput,
  deps: ListUserOrdersDeps,
): Promise<Order[]> => {
  const parsed = ListUserOrdersInputSchema.parse(input);
  const orders = await deps.orderRepository.findByUserId(parsed.userId);
  return [...orders].sort((a, b) => {
    const ta = a.createdAt?.getTime() ?? 0;
    const tb = b.createdAt?.getTime() ?? 0;
    return tb - ta;
  });
};
