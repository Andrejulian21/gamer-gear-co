import { Order, CreateOrderInput } from '../entities/Order';
import { OrderStatus } from '../entities/OrderStatus';

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findAll(filters?: OrderFilters): Promise<Order[]>;
  findByWompiReference(reference: string): Promise<Order | null>;
  create(orderData: CreateOrderInput): Promise<Order>;
  update(id: string, data: Partial<CreateOrderInput>): Promise<Order>;
  delete(id: string): Promise<void>;
}
