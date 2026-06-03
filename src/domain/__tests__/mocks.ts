import { vi } from 'vitest';
import type { UserRepository } from '../repositories/UserRepository';
import type { ProductRepository, ListProductsFilters } from '../repositories/ProductRepository';
import type { BrandRepository } from '../repositories/BrandRepository';
import type { CategoryRepository } from '../repositories/CategoryRepository';
import type { OrderRepository, OrderFilters } from '../repositories/OrderRepository';
import type { CartRepository } from '../repositories/CartRepository';
import type { AddressRepository } from '../repositories/AddressRepository';

import type { User } from '../entities/User';
import type { Product } from '../entities/Product';
import type { Brand } from '../entities/Brand';
import type { Category } from '../entities/Category';
import type { Order } from '../entities/Order';
import type { CartItem } from '../entities/CartItem';
import type { Address } from '../entities/Address';

import type { AddItemToCartDeps } from '../use-cases/cart/AddItemToCart';

/**
 * Test factory for AddItemToCartDeps. Pre-wires a mock cart and product
 * repository so tests that don't exercise stock or product-lookup logic
 * can stay terse.
 *
 * Tests that need to control stock or simulate "product not found" should
 * build the deps manually with `createMockProductRepository` and seed it.
 */
export const createMockAddItemToCartDeps = (
  overrides: {
    cartRepository?: CartRepository;
    productRepository?: ProductRepository;
  } = {},
): AddItemToCartDeps => ({
  cartRepository: overrides.cartRepository ?? createMockCartRepository(),
  productRepository: overrides.productRepository ?? createMockProductRepository(),
});

export const createMockUserRepository = (
  overrides: Partial<UserRepository> = {},
): UserRepository => {
  const users = new Map<string, User>();
  const usersByEmail = new Map<string, User>();

  return {
    findById: vi.fn(async (id: string) => users.get(id) ?? null),
    findByEmail: vi.fn(async (email: string) => usersByEmail.get(email) ?? null),
    create: vi.fn(async (userData) => {
      const existing = usersByEmail.get(userData.email);
      if (existing) {
        throw new Error(`User with email ${userData.email} already exists`);
      }
      const user: User = {
        id: crypto.randomUUID(),
        email: userData.email,
        name: userData.name,
        hashedPassword: userData.hashedPassword,
        role: userData.role ?? 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(user.id, user);
      usersByEmail.set(user.email, user);
      return user;
    }),
    update: vi.fn(async (id: string, data) => {
      const user = users.get(id);
      if (!user) throw new Error(`User ${id} not found`);
      const updated: User = {
        ...user,
        ...data,
        updatedAt: new Date(),
      } as User;
      users.set(id, updated);
      if (data.email) usersByEmail.set(data.email, updated);
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      const user = users.get(id);
      if (user) {
        usersByEmail.delete(user.email);
        users.delete(id);
      }
    }),
    findAll: vi.fn(async () => Array.from(users.values())),
    findAllPaginated: vi.fn(
      async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
        const all = Array.from(users.values());
        const filtered = search
          ? all.filter(
              (u) =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()),
            )
          : all;
        // Stable "newest first" — Map preserves insertion order, so
        // newer entries (created later in test) come last; reverse for desc.
        const sorted = [...filtered].reverse();
        const offset = (page - 1) * pageSize;
        return sorted.slice(offset, offset + pageSize);
      },
    ),
    countAll: vi.fn(async () => users.size),
    countByRole: vi.fn(
      async (role: 'USER' | 'ADMIN') =>
        Array.from(users.values()).filter((u) => u.role === role).length,
    ),
    ...overrides,
  };
};

export const createMockProductRepository = (
  overrides: Partial<ProductRepository> = {},
): ProductRepository => {
  const products = new Map<string, Product>();
  const productsBySlug = new Map<string, Product>();

  const matches = (p: Product, f: ListProductsFilters): boolean => {
    if (f.brandId && p.brandId !== f.brandId) return false;
    if (f.categoryId && p.categoryId !== f.categoryId) return false;
    if (f.search && !p.name.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.minPrice !== undefined && p.price < f.minPrice) return false;
    if (f.maxPrice !== undefined && p.price > f.maxPrice) return false;
    if (f.featured !== undefined && p.featured !== f.featured) return false;
    return true;
  };

  return {
    findById: vi.fn(async (id: string) => products.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => productsBySlug.get(slug) ?? null),
    findMany: vi.fn(async (filters: ListProductsFilters) => {
      const all = Array.from(products.values()).filter((p) => matches(p, filters));
      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? all.length;
      return all.slice(offset, offset + limit);
    }),
    create: vi.fn(async (productData) => {
      const product: Product = {
        id: crypto.randomUUID(),
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products.set(product.id, product);
      productsBySlug.set(product.slug, product);
      return product;
    }),
    update: vi.fn(async (id: string, data) => {
      const product = products.get(id);
      if (!product) throw new Error(`Product ${id} not found`);
      const updated: Product = {
        ...product,
        ...data,
        updatedAt: new Date(),
      } as Product;
      products.set(id, updated);
      if (data.slug) productsBySlug.set(data.slug, updated);
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      const product = products.get(id);
      if (product) {
        productsBySlug.delete(product.slug);
        products.delete(id);
      }
    }),
    count: vi.fn(async (filters) => {
      const all = Array.from(products.values()).filter((p) => matches(p, filters));
      return all.length;
    }),
    findLowStock: vi.fn(async (threshold: number) =>
      Array.from(products.values())
        .filter((p) => p.stock < threshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 20),
    ),
    ...overrides,
  };
};

export const createMockBrandRepository = (
  overrides: Partial<BrandRepository> = {},
): BrandRepository => {
  const brands = new Map<string, Brand>();
  const brandsBySlug = new Map<string, Brand>();

  return {
    findById: vi.fn(async (id: string) => brands.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => brandsBySlug.get(slug) ?? null),
    findAll: vi.fn(async () => Array.from(brands.values())),
    create: vi.fn(async (brandData) => {
      const brand: Brand = {
        id: crypto.randomUUID(),
        ...brandData,
        createdAt: new Date(),
      };
      brands.set(brand.id, brand);
      brandsBySlug.set(brand.slug, brand);
      return brand;
    }),
    update: vi.fn(async (id: string, data) => {
      const brand = brands.get(id);
      if (!brand) throw new Error(`Brand ${id} not found`);
      const updated: Brand = { ...brand, ...data } as Brand;
      brands.set(id, updated);
      if (data.slug) brandsBySlug.set(data.slug, updated);
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      const brand = brands.get(id);
      if (brand) {
        brandsBySlug.delete(brand.slug);
        brands.delete(id);
      }
    }),
    ...overrides,
  };
};

export const createMockCategoryRepository = (
  overrides: Partial<CategoryRepository> = {},
): CategoryRepository => {
  const categories = new Map<string, Category>();
  const categoriesBySlug = new Map<string, Category>();

  return {
    findById: vi.fn(async (id: string) => categories.get(id) ?? null),
    findBySlug: vi.fn(async (slug: string) => categoriesBySlug.get(slug) ?? null),
    findAll: vi.fn(async () => Array.from(categories.values())),
    create: vi.fn(async (categoryData) => {
      const category: Category = {
        id: crypto.randomUUID(),
        ...categoryData,
        createdAt: new Date(),
      };
      categories.set(category.id, category);
      categoriesBySlug.set(category.slug, category);
      return category;
    }),
    update: vi.fn(async (id: string, data) => {
      const category = categories.get(id);
      if (!category) throw new Error(`Category ${id} not found`);
      const updated: Category = { ...category, ...data } as Category;
      categories.set(id, updated);
      if (data.slug) categoriesBySlug.set(data.slug, updated);
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      const category = categories.get(id);
      if (category) {
        categoriesBySlug.delete(category.slug);
        categories.delete(id);
      }
    }),
    ...overrides,
  };
};

export const createMockOrderRepository = (
  overrides: Partial<OrderRepository> = {},
): OrderRepository => {
  const orders = new Map<string, Order>();
  const ordersByRef = new Map<string, Order>();

  const matches = (o: Order, f: OrderFilters = {}): boolean => {
    if (f.status && o.status !== f.status) return false;
    if (f.userId && o.userId !== f.userId) return false;
    return true;
  };

  return {
    findById: vi.fn(async (id: string) => orders.get(id) ?? null),
    findByUserId: vi.fn(
      async (
        userId: string,
        filters?: {
          status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
        },
      ) =>
        Array.from(orders.values()).filter(
          (o) => o.userId === userId && (!filters?.status || o.status === filters.status),
        ),
    ),
    findAll: vi.fn(async (filters: OrderFilters = {}) =>
      Array.from(orders.values()).filter((o) => matches(o, filters)),
    ),
    findByWompiReference: vi.fn(async (ref: string) => ordersByRef.get(ref) ?? null),
    create: vi.fn(async (orderData) => {
      const order: Order = {
        id: crypto.randomUUID(),
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      orders.set(order.id, order);
      if (order.wompiReference) {
        ordersByRef.set(order.wompiReference, order);
      }
      return order;
    }),
    update: vi.fn(async (id: string, data) => {
      const order = orders.get(id);
      if (!order) throw new Error(`Order ${id} not found`);
      const updated: Order = { ...order, ...data, updatedAt: new Date() } as Order;
      orders.set(id, updated);
      if (data.wompiReference) {
        ordersByRef.set(data.wompiReference, updated);
      }
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      const order = orders.get(id);
      if (order && order.wompiReference) {
        ordersByRef.delete(order.wompiReference);
      }
      orders.delete(id);
    }),
    findAllPaginated: vi.fn(
      async (
        filters: { status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED' },
        pagination: { page: number; pageSize: number },
      ) => {
        const all = Array.from(orders.values()).filter((o) => matches(o, filters));
        const sorted = [...all].sort((a, b) => {
          const ta = a.createdAt?.getTime() ?? 0;
          const tb = b.createdAt?.getTime() ?? 0;
          return tb - ta;
        });
        const offset = (pagination.page - 1) * pagination.pageSize;
        return sorted.slice(offset, offset + pagination.pageSize);
      },
    ),
    countByStatus: vi.fn(async () => {
      const counts: Record<string, number> = {
        PENDING: 0,
        PAID: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELLED: 0,
        FAILED: 0,
      };
      for (const o of Array.from(orders.values())) {
        counts[o.status] = (counts[o.status] ?? 0) + 1;
      }
      return counts as Record<
        'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED',
        number
      >;
    }),
    sumRevenuePaid: vi.fn(async () => {
      let total = 0;
      for (const o of Array.from(orders.values())) {
        if (o.status === 'PAID') total += o.total;
      }
      return total;
    }),
    ...overrides,
  };
};

export const createMockCartRepository = (
  overrides: Partial<CartRepository> = {},
): CartRepository => {
  const items = new Map<string, CartItem>(); // key: userId-productId

  return {
    findByUserId: vi.fn(async (userId: string) =>
      Array.from(items.values()).filter((i) => i.userId === userId),
    ),
    addItem: vi.fn(async (userId: string, productId: string, quantity: number) => {
      const key = `${userId}-${productId}`;
      const existing = items.get(key);
      if (existing) {
        const updated: CartItem = {
          ...existing,
          quantity: existing.quantity + quantity,
        };
        items.set(key, updated);
        return updated;
      }
      const item: CartItem = {
        id: crypto.randomUUID(),
        userId,
        productId,
        quantity,
      };
      items.set(key, item);
      return item;
    }),
    updateQuantity: vi.fn(async (userId: string, productId: string, quantity: number) => {
      const key = `${userId}-${productId}`;
      const existing = items.get(key);
      if (!existing) {
        throw new Error(`Cart item for user ${userId} and product ${productId} not found`);
      }
      const updated: CartItem = { ...existing, quantity };
      items.set(key, updated);
      return updated;
    }),
    removeItem: vi.fn(async (userId: string, productId: string) => {
      items.delete(`${userId}-${productId}`);
    }),
    clear: vi.fn(async (userId: string) => {
      const prefix = `${userId}-`;
      for (const key of Array.from(items.keys())) {
        if (key.startsWith(prefix)) {
          items.delete(key);
        }
      }
    }),
    ...overrides,
  };
};

export const createMockAddressRepository = (
  overrides: Partial<AddressRepository> = {},
): AddressRepository => {
  const addresses = new Map<string, Address>();

  return {
    findById: vi.fn(async (id: string) => addresses.get(id) ?? null),
    findByUserId: vi.fn(async (userId: string) =>
      Array.from(addresses.values()).filter((a) => a.userId === userId),
    ),
    create: vi.fn(async (addressData) => {
      const address: Address = {
        id: crypto.randomUUID(),
        ...addressData,
        createdAt: new Date(),
      };
      addresses.set(address.id, address);
      return address;
    }),
    update: vi.fn(async (id: string, data) => {
      const address = addresses.get(id);
      if (!address) throw new Error(`Address ${id} not found`);
      const updated: Address = { ...address, ...data } as Address;
      addresses.set(id, updated);
      return updated;
    }),
    delete: vi.fn(async (id: string) => {
      addresses.delete(id);
    }),
    setDefault: vi.fn(async (userId: string, addressId: string) => {
      for (const [id, a] of Array.from(addresses.entries())) {
        if (a.userId === userId) {
          const updated: Address = { ...a, isDefault: id === addressId };
          addresses.set(id, updated);
        }
      }
      const address = addresses.get(addressId);
      if (!address) throw new Error(`Address ${addressId} not found`);
      return address;
    }),
    ...overrides,
  };
};
