import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { Order } from '@/domain/entities/Order';
import type { OrderStatus } from '@/domain/entities/OrderStatus';

/**
 * Products with stock strictly below this threshold appear in the
 * "low stock" list on the admin dashboard. Centralized here so the
 * UI and any future background job share the same number.
 */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * The dashboard's "Recent orders" list is capped at this size.
 * The repository's `findAll` is sliced in-memory after ordering.
 */
export const RECENT_ORDERS_LIMIT = 10;

export interface DashboardStats {
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalProducts: number;
  totalUsers: number;
  lowStockProducts: ReturnType<ProductRepository['findLowStock']> extends Promise<infer T>
    ? T
    : never;
  recentOrders: Order[];
}

export interface GetDashboardStatsDeps {
  orderRepository: OrderRepository;
  productRepository: ProductRepository;
  userRepository: UserRepository;
}

/**
 * Admin use case: aggregate stats for the dashboard landing page.
 *
 * Reads are issued sequentially because:
 *   1. The Prisma client is a single global connection pool;
 *      concurrent `await`s would still serialize under the hood.
 *   2. The number of aggregates is small (5) so the wall-clock
 *      difference vs. Promise.all is negligible.
 *
 * Returns a single `DashboardStats` object the UI can render in
 * one pass. All values are deterministic for an empty DB (zeros,
 * empty arrays).
 */
export const getDashboardStats = async (deps: GetDashboardStatsDeps): Promise<DashboardStats> => {
  const totalRevenue = await deps.orderRepository.sumRevenuePaid();
  const ordersByStatus = await deps.orderRepository.countByStatus();
  const totalProducts = await deps.productRepository.count({});
  const totalUsers = await deps.userRepository.countAll();
  const lowStockProducts = await deps.productRepository.findLowStock(LOW_STOCK_THRESHOLD);
  const allOrders = await deps.orderRepository.findAll({});
  const recentOrders = allOrders.slice(0, RECENT_ORDERS_LIMIT);

  return {
    totalRevenue,
    ordersByStatus,
    totalProducts,
    totalUsers,
    lowStockProducts,
    recentOrders,
  };
};
