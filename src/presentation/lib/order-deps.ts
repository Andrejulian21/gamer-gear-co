/**
 * Order dependency factory.
 *
 * Wires the order-related infrastructure (Prisma repositories, Prisma client)
 * to the domain use cases. This is the single import path used by every
 * server action, server component, and route handler that needs to interact
 * with orders.
 *
 * The returned `createOrderFromCart`, `getOrder`, etc. are use-case
 * functions with their dependencies pre-wired — callers only pass the
 * domain input. This keeps call sites terse:
 *
 *     const { createOrderFromCart } = getOrderDeps();
 *     await createOrderFromCart({ userId, shippingAddress });
 *
 * For `processPaymentResult` the caller must additionally open a
 * Prisma transaction and pass the transaction client via `tx`. The
 * factory exposes `prisma` for that purpose.
 *
 * Keeps repository construction in one place so we never accidentally
 * build multiple PrismaClient instances per request and so we can swap
 * implementations in tests by replacing this module.
 */

import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaCartRepository } from '@/infrastructure/repositories/PrismaCartRepository';
import { prisma } from '@/infrastructure/db/prisma';

import { createOrderFromCart as createOrderFromCartUseCase } from '@/domain/use-cases/orders/CreateOrderFromCart';
import { getOrder as getOrderUseCase } from '@/domain/use-cases/orders/GetOrder';
import { listUserOrders as listUserOrdersUseCase } from '@/domain/use-cases/orders/ListUserOrders';
import { processPaymentResult as processPaymentResultUseCase } from '@/domain/use-cases/orders/ProcessPaymentResult';

import type { CreateOrderFromCartInput } from '@/domain/use-cases/orders/CreateOrderFromCart';
import type { GetOrderInput } from '@/domain/use-cases/orders/GetOrder';
import type { ListUserOrdersInput } from '@/domain/use-cases/orders/ListUserOrders';
import type {
  ProcessPaymentResultInput,
  PrismaTransactionClient,
} from '@/domain/use-cases/orders/ProcessPaymentResult';

import type { Order } from '@/domain/entities/Order';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { CartRepository } from '@/domain/repositories/CartRepository';

import type { PrismaClient } from '@prisma/client';

export interface OrderDeps {
  orderRepository: OrderRepository;
  productRepository: ProductRepository;
  cartRepository: CartRepository;
  prisma: PrismaClient;
  createOrderFromCart: (input: CreateOrderFromCartInput) => Promise<Order>;
  getOrder: (input: GetOrderInput) => Promise<Order>;
  listUserOrders: (input: ListUserOrdersInput) => Promise<Order[]>;
  /**
   * Process the result of a Wompi webhook. The caller must pass a
   * Prisma transaction client as `tx` so that stock decrement + status
   * update + cart clear happen atomically.
   */
  processPaymentResult: (
    input: ProcessPaymentResultInput,
    tx: PrismaTransactionClient,
  ) => Promise<Order>;
}

/**
 * Build a fully-wired set of order dependencies. Safe to call multiple
 * times per request — repositories are cheap to instantiate and the
 * underlying PrismaClient is a global singleton.
 */
export function getOrderDeps(): OrderDeps {
  const orderRepository = new PrismaOrderRepository();
  const productRepository = new PrismaProductRepository();
  const cartRepository = new PrismaCartRepository();

  return {
    orderRepository,
    productRepository,
    cartRepository,
    prisma,

    createOrderFromCart: (input) =>
      createOrderFromCartUseCase(input, { cartRepository, productRepository, orderRepository }),

    getOrder: (input) => getOrderUseCase(input, { orderRepository }),

    listUserOrders: (input) => listUserOrdersUseCase(input, { orderRepository }),

    processPaymentResult: (input, tx) =>
      processPaymentResultUseCase(input, { orderRepository, tx }),
  };
}
