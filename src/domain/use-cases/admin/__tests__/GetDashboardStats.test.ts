import { describe, it, expect } from 'vitest';
import { getDashboardStats, LOW_STOCK_THRESHOLD } from '../GetDashboardStats';
import {
  createMockOrderRepository,
  createMockProductRepository,
  createMockUserRepository,
} from '@/domain/__tests__/mocks';
import type { Order } from '@/domain/entities/Order';
import type { Product } from '@/domain/entities/Product';
import type { User } from '@/domain/entities/User';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'p1', quantity: 1, price: 100 }],
  total: 100,
  status: 'PAID',
  wompiReference: 'r1',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
  ...overrides,
});

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Keyboard',
  slug: 'keyboard',
  description: 'A keyboard',
  price: 100,
  stock: 10,
  images: [],
  brandId: 'b1',
  categoryId: 'c1',
  featured: false,
  ...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'h',
  role: 'USER',
  ...overrides,
});

describe('getDashboardStats (admin)', () => {
  it('returns zeros for an empty database', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalProducts).toBe(0);
    expect(stats.totalUsers).toBe(0);
    expect(stats.lowStockProducts).toEqual([]);
    expect(stats.recentOrders).toEqual([]);
    expect(stats.ordersByStatus).toEqual({
      PENDING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      FAILED: 0,
    });
  });

  it('aggregates total revenue from PAID orders only', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();
    await orderRepo.create(makeOrder({ id: 'a', total: 100, status: 'PAID' }));
    await orderRepo.create(makeOrder({ id: 'b', total: 50, status: 'PAID' }));
    await orderRepo.create(makeOrder({ id: 'c', total: 999, status: 'PENDING' }));
    await orderRepo.create(makeOrder({ id: 'd', total: 999, status: 'CANCELLED' }));

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    expect(stats.totalRevenue).toBe(150);
  });

  it('counts orders by status', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();
    await orderRepo.create(makeOrder({ id: 'a', status: 'PAID' }));
    await orderRepo.create(makeOrder({ id: 'b', status: 'PAID' }));
    await orderRepo.create(makeOrder({ id: 'c', status: 'PENDING' }));
    await orderRepo.create(makeOrder({ id: 'd', status: 'FAILED' }));

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    expect(stats.ordersByStatus.PAID).toBe(2);
    expect(stats.ordersByStatus.PENDING).toBe(1);
    expect(stats.ordersByStatus.FAILED).toBe(1);
    expect(stats.ordersByStatus.SHIPPED).toBe(0);
    expect(stats.ordersByStatus.DELIVERED).toBe(0);
    expect(stats.ordersByStatus.CANCELLED).toBe(0);
  });

  it('counts total products and users', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();
    await productRepo.create(makeProduct({ id: 'p1', slug: 'p1' }));
    await productRepo.create(makeProduct({ id: 'p2', slug: 'p2' }));
    await productRepo.create(makeProduct({ id: 'p3', slug: 'p3' }));
    await userRepo.create(makeUser({ email: 'u1@x.com' }));
    await userRepo.create(makeUser({ email: 'u2@x.com' }));

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    expect(stats.totalProducts).toBe(3);
    expect(stats.totalUsers).toBe(2);
  });

  it('returns products with stock strictly below the low-stock threshold', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();
    await productRepo.create(makeProduct({ id: 'low', slug: 'low', stock: 1 }));
    await productRepo.create(
      makeProduct({ id: 'boundary', slug: 'boundary', stock: LOW_STOCK_THRESHOLD }),
    );
    await productRepo.create(makeProduct({ id: 'plenty', slug: 'plenty', stock: 50 }));

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    // `boundary` is exactly at threshold (5) — should NOT appear
    // (the comparison is `stock < threshold`).
    const ids = stats.lowStockProducts.map((p) => p.id);
    expect(ids).toContain('low');
    expect(ids).not.toContain('boundary');
    expect(ids).not.toContain('plenty');
  });

  it('limits recent orders to 10 (newest first)', async () => {
    const orderRepo = createMockOrderRepository();
    const productRepo = createMockProductRepository();
    const userRepo = createMockUserRepository();
    for (let i = 1; i <= 15; i++) {
      await orderRepo.create(makeOrder({ id: `o-${i}` }));
    }

    const stats = await getDashboardStats({
      orderRepository: orderRepo,
      productRepository: productRepo,
      userRepository: userRepo,
    });

    expect(stats.recentOrders.length).toBeLessThanOrEqual(10);
  });
});
