import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { Order } from '@/domain/entities/Order';
import type { OrderStatus } from '@/domain/entities/OrderStatus';

export interface ListAllOrdersInput {
  filters?: { status?: OrderStatus };
  page: number;
  pageSize: number;
}

export interface ListAllOrdersDeps {
  orderRepository: OrderRepository;
}

/**
 * Admin use case: paginated order listing.
 *
 * Newest orders first. The optional `filters.status` narrows by status
 * (e.g. show only PAID). Defaults to page 1 / pageSize 20.
 */
export const PAGE_SIZE = 20;

export const listAllOrders = async (
  input: ListAllOrdersInput,
  deps: ListAllOrdersDeps,
): Promise<Order[]> => {
  const { filters = {}, page, pageSize } = input;
  return deps.orderRepository.findAllPaginated(filters, { page, pageSize });
};
