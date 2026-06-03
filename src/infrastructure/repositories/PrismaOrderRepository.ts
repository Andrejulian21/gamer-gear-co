import { prisma } from '../db/prisma';
import type {
  OrderRepository,
  OrderFilters,
  OrderListFilters,
  OrderPagination,
} from '@/domain/repositories/OrderRepository';
import type { Order, CreateOrderInput } from '@/domain/entities/Order';
import { OrderStatus } from '@/domain/entities/OrderStatus';
import { Prisma } from '@prisma/client';

const toDomain = (o: {
  id: string;
  userId: string;
  total: Prisma.Decimal;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  wompiReference: string | null;
  shippingAddress: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  items?: { productId: string; quantity: number; price: Prisma.Decimal }[];
}): Order => {
  const shipping = (o.shippingAddress ?? {}) as {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };

  return {
    id: o.id,
    userId: o.userId,
    items: (o.items ?? []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      price: it.price.toNumber(),
    })),
    total: o.total.toNumber(),
    status: o.status,
    wompiReference: o.wompiReference ?? undefined,
    shippingAddress: {
      street: shipping.street ?? '',
      city: shipping.city ?? '',
      state: shipping.state ?? '',
      zipCode: shipping.zipCode ?? '',
      phone: shipping.phone ?? '',
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
};

export class PrismaOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return order ? toDomain(order) : null;
  }

  async findByUserId(userId: string, filters?: OrderListFilters): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = { userId };
    if (filters?.status) where.status = filters.status;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toDomain);
  }

  async findAll(filters?: OrderFilters): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toDomain);
  }

  async findByWompiReference(reference: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { wompiReference: reference },
      include: { items: true },
    });
    return order ? toDomain(order) : null;
  }

  async create(orderData: CreateOrderInput): Promise<Order> {
    const order = await prisma.order.create({
      data: {
        userId: orderData.userId,
        total: new Prisma.Decimal(orderData.total),
        status: orderData.status,
        wompiReference: orderData.wompiReference ?? null,
        shippingAddress: orderData.shippingAddress as Prisma.InputJsonValue,
        items: {
          create: orderData.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
          })),
        },
      },
      include: { items: true },
    });
    return toDomain(order);
  }

  async update(id: string, data: Partial<CreateOrderInput>): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {};
    if (data.total !== undefined) updateData.total = new Prisma.Decimal(data.total);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.wompiReference !== undefined) updateData.wompiReference = data.wompiReference;
    if (data.shippingAddress !== undefined)
      updateData.shippingAddress = data.shippingAddress as Prisma.InputJsonValue;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
    return toDomain(order);
  }

  async delete(id: string): Promise<void> {
    await prisma.order.delete({ where: { id } });
  }

  async findAllPaginated(filters: OrderListFilters, pagination: OrderPagination): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};
    if (filters.status) where.status = filters.status;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });
    return orders.map(toDomain);
  }

  async countByStatus(): Promise<Record<OrderStatus, number>> {
    // Initialize with zero for every status so the caller gets a
    // stable, exhaustive record (no missing keys).
    const base: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PAID]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.FAILED]: 0,
    };

    const groups = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    for (const g of groups) {
      base[g.status as OrderStatus] = g._count._all;
    }
    return base;
  }

  async sumRevenuePaid(): Promise<number> {
    const result = await prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true },
    });
    return result._sum.total?.toNumber() ?? 0;
  }
}
