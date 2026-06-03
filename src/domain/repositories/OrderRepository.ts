import { Order, CreateOrderInput } from '../entities/Order';
import { OrderStatus } from '../entities/OrderStatus';

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
}

export interface OrderListFilters {
  status?: OrderStatus;
}

export interface OrderPagination {
  page: number;
  pageSize: number;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  /**
   * List all orders for a user, optionally narrowed to a single
   * status. Default ordering is repository-defined (Prisma: createdAt desc;
   * mock: insertion order). The use case applies the final desc sort.
   */
  findByUserId(userId: string, filters?: OrderListFilters): Promise<Order[]>;
  findAll(filters?: OrderFilters): Promise<Order[]>;
  findByWompiReference(reference: string): Promise<Order | null>;
  create(orderData: CreateOrderInput): Promise<Order>;
  update(id: string, data: Partial<CreateOrderInput>): Promise<Order>;
  delete(id: string): Promise<void>;
  /**
   * Paginated order listing for the admin UI. The repository handles
   * the WHERE status filter (if any) and the ORDER BY createdAt DESC.
   */
  findAllPaginated(filters: OrderListFilters, pagination: OrderPagination): Promise<Order[]>;
  /**
   * Aggregate count of orders grouped by status. The returned record
   * always contains a key for every OrderStatus — statuses with no
   * orders present map to 0. The caller can rely on exhaustive keys.
   */
  countByStatus(): Promise<Record<OrderStatus, number>>;
  /**
   * Sum of the `total` field for every order in PAID status. Returns
   * 0 when no paid orders exist (rather than null). Used by the
   * admin dashboard for the "total revenue" tile.
   */
  sumRevenuePaid(): Promise<number>;
}
