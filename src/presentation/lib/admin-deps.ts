/**
 * Admin dependency factory.
 *
 * Wires the admin-related infrastructure (Prisma repositories, blob
 * upload helpers, Prisma client) to the domain use cases. This is the
 * single import path used by every admin server action, server
 * component, and route handler.
 *
 * Pattern mirrors `order-deps.ts` — the returned use case functions
 * are pre-wired with their dependencies; callers only pass the domain
 * input. This keeps call sites terse:
 *
 *     const { listAllOrders, updateOrderStatus } = getAdminDeps();
 *     await listAllOrders({ page: 1, pageSize: 20 }, ...);
 *
 * `prisma` is exposed in case any admin action needs to open a
 * transaction context (mirrors order-deps).
 *
 * `uploadImage` and `deleteImage` are the Vercel Blob helpers — they
 * are exposed so admin forms (product image upload, brand logo) can
 * call them directly from server actions.
 */

import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaCategoryRepository } from '@/infrastructure/repositories/PrismaCategoryRepository';
import { PrismaAddressRepository } from '@/infrastructure/repositories/PrismaAddressRepository';
import { prisma } from '@/infrastructure/db/prisma';

import { updateProduct as updateProductUseCase } from '@/domain/use-cases/admin/UpdateProduct';
import { deleteProduct as deleteProductUseCase } from '@/domain/use-cases/admin/DeleteProduct';
import { createBrand as createBrandUseCase } from '@/domain/use-cases/admin/CreateBrand';
import { updateBrand as updateBrandUseCase } from '@/domain/use-cases/admin/UpdateBrand';
import { deleteBrand as deleteBrandUseCase } from '@/domain/use-cases/admin/DeleteBrand';
import { createCategory as createCategoryUseCase } from '@/domain/use-cases/admin/CreateCategory';
import { updateCategory as updateCategoryUseCase } from '@/domain/use-cases/admin/UpdateCategory';
import { deleteCategory as deleteCategoryUseCase } from '@/domain/use-cases/admin/DeleteCategory';
import { updateOrderStatus as updateOrderStatusUseCase } from '@/domain/use-cases/admin/UpdateOrderStatus';
import { listAllOrders as listAllOrdersUseCase } from '@/domain/use-cases/admin/ListAllOrders';
import { getOrderForAdmin as getOrderForAdminUseCase } from '@/domain/use-cases/admin/GetOrderForAdmin';
import { listAllUsers as listAllUsersUseCase } from '@/domain/use-cases/admin/ListAllUsers';
import { getUserDetail as getUserDetailUseCase } from '@/domain/use-cases/admin/GetUserDetail';
import { updateUserRole as updateUserRoleUseCase } from '@/domain/use-cases/admin/UpdateUserRole';
import { getDashboardStats as getDashboardStatsUseCase } from '@/domain/use-cases/admin/GetDashboardStats';

import type { UpdateProductInput } from '@/domain/use-cases/admin/UpdateProduct';
import type { DeleteProductInput } from '@/domain/use-cases/admin/DeleteProduct';
import type { UpdateBrandInput } from '@/domain/use-cases/admin/UpdateBrand';
import type { DeleteBrandInput } from '@/domain/use-cases/admin/DeleteBrand';
import type { CreateCategoryInput } from '@/domain/entities/Category';
import type { UpdateCategoryInput } from '@/domain/use-cases/admin/UpdateCategory';
import type { DeleteCategoryInput } from '@/domain/use-cases/admin/DeleteCategory';
import type { UpdateOrderStatusInput } from '@/domain/use-cases/admin/UpdateOrderStatus';
import type { ListAllOrdersInput } from '@/domain/use-cases/admin/ListAllOrders';
import type { GetOrderForAdminInput } from '@/domain/use-cases/admin/GetOrderForAdmin';
import type { ListAllUsersInput } from '@/domain/use-cases/admin/ListAllUsers';
import type { GetUserDetailInput, UserDetail } from '@/domain/use-cases/admin/GetUserDetail';
import type { UpdateUserRoleInput } from '@/domain/use-cases/admin/UpdateUserRole';
import type { DashboardStats } from '@/domain/use-cases/admin/GetDashboardStats';

import type { Product } from '@/domain/entities/Product';
import type { Brand, CreateBrandInput } from '@/domain/entities/Brand';
import type { Category } from '@/domain/entities/Category';
import type { Order } from '@/domain/entities/Order';
import type { User } from '@/domain/entities/User';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { BrandRepository } from '@/domain/repositories/BrandRepository';
import type { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';

import type { PrismaClient } from '@prisma/client';
import {
  uploadImage as uploadImageFn,
  deleteImage as deleteImageFn,
  type BlobFolder,
} from '@/infrastructure/uploads/blob';

export interface AdminDeps {
  // Repositories (exposed in case admins need to bypass use cases)
  userRepository: UserRepository;
  orderRepository: OrderRepository;
  productRepository: ProductRepository;
  brandRepository: BrandRepository;
  categoryRepository: CategoryRepository;
  addressRepository: AddressRepository;
  prisma: PrismaClient;

  // Product CRUD
  updateProduct: (input: UpdateProductInput) => Promise<Product>;
  deleteProduct: (input: DeleteProductInput) => Promise<void>;

  // Brand CRUD
  createBrand: (input: CreateBrandInput) => Promise<Brand>;
  updateBrand: (input: UpdateBrandInput) => Promise<Brand>;
  deleteBrand: (input: DeleteBrandInput) => Promise<void>;

  // Category CRUD
  createCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (input: DeleteCategoryInput) => Promise<void>;

  // Order management
  listAllOrders: (input: ListAllOrdersInput) => Promise<Order[]>;
  getOrderForAdmin: (input: GetOrderForAdminInput) => Promise<Order>;
  updateOrderStatus: (input: UpdateOrderStatusInput) => Promise<Order>;

  // User management
  listAllUsers: (input: ListAllUsersInput) => Promise<User[]>;
  getUserDetail: (input: GetUserDetailInput) => Promise<UserDetail>;
  updateUserRole: (input: UpdateUserRoleInput) => Promise<User>;

  // Dashboard
  getDashboardStats: () => Promise<DashboardStats>;

  // Image upload
  uploadImage: typeof uploadImageFn;
  deleteImage: typeof deleteImageFn;
}

// Re-export the BlobFolder type for callers that want a typed folder arg.
export type { BlobFolder };

/**
 * Build a fully-wired set of admin dependencies. Safe to call multiple
 * times per request — repositories are cheap to instantiate and the
 * underlying PrismaClient is a global singleton.
 */
export function getAdminDeps(): AdminDeps {
  const userRepository = new PrismaUserRepository();
  const orderRepository = new PrismaOrderRepository();
  const productRepository = new PrismaProductRepository();
  const brandRepository = new PrismaBrandRepository();
  const categoryRepository = new PrismaCategoryRepository();
  const addressRepository = new PrismaAddressRepository();

  return {
    userRepository,
    orderRepository,
    productRepository,
    brandRepository,
    categoryRepository,
    addressRepository,
    prisma,

    // Product
    updateProduct: (input) => updateProductUseCase(input, { productRepository }),
    deleteProduct: (input) => deleteProductUseCase(input, { productRepository }),

    // Brand
    createBrand: (input) => createBrandUseCase(input, { brandRepository }),
    updateBrand: (input) => updateBrandUseCase(input, { brandRepository }),
    deleteBrand: (input) => deleteBrandUseCase(input, { brandRepository }),

    // Category
    createCategory: (input) => createCategoryUseCase(input, { categoryRepository }),
    updateCategory: (input) => updateCategoryUseCase(input, { categoryRepository }),
    deleteCategory: (input) => deleteCategoryUseCase(input, { categoryRepository }),

    // Order
    listAllOrders: (input) => listAllOrdersUseCase(input, { orderRepository }),
    getOrderForAdmin: (input) => getOrderForAdminUseCase(input, { orderRepository }),
    updateOrderStatus: (input) => updateOrderStatusUseCase(input, { orderRepository }),

    // User
    listAllUsers: (input) => listAllUsersUseCase(input, { userRepository }),
    getUserDetail: (input) =>
      getUserDetailUseCase(input, { userRepository, orderRepository, addressRepository }),
    updateUserRole: (input) => updateUserRoleUseCase(input, { userRepository }),

    // Dashboard
    getDashboardStats: () =>
      getDashboardStatsUseCase({ orderRepository, productRepository, userRepository }),

    // Image upload
    uploadImage: uploadImageFn,
    deleteImage: deleteImageFn,
  };
}
