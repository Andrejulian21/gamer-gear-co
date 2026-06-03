/**
 * Cart dependency factory.
 *
 * Wires the cart-related infrastructure (Prisma repositories) to the
 * domain use cases. This is the single import path used by every server
 * action and server component that needs to interact with the cart.
 *
 * The returned `addItemToCart`, `removeFromCart`, etc. are use-case
 * functions with their dependencies pre-wired — callers only pass the
 * domain input. This keeps the call sites terse:
 *
 *     const { addItemToCart } = getCartDeps();
 *     await addItemToCart({ userId, productId, quantity });
 *
 * Keeps repository construction in one place so we never accidentally
 * build multiple PrismaClient instances per request and so we can swap
 * implementations in tests by replacing this module.
 */

import { PrismaCartRepository } from '@/infrastructure/repositories/PrismaCartRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';

import { addItemToCart as addItemToCartUseCase } from '@/domain/use-cases/cart/AddItemToCart';
import { removeFromCart as removeFromCartUseCase } from '@/domain/use-cases/cart/RemoveFromCart';
import { updateCartItemQuantity as updateCartItemQuantityUseCase } from '@/domain/use-cases/cart/UpdateCartItemQuantity';
import { clearCart as clearCartUseCase } from '@/domain/use-cases/cart/ClearCart';
import { getCart as getCartUseCase } from '@/domain/use-cases/cart/GetCart';

import type { AddItemToCartInput } from '@/domain/use-cases/cart/AddItemToCart';
import type { RemoveFromCartInput } from '@/domain/use-cases/cart/RemoveFromCart';
import type { UpdateCartItemQuantityInput } from '@/domain/use-cases/cart/UpdateCartItemQuantity';
import type { ClearCartInput } from '@/domain/use-cases/cart/ClearCart';
import type { GetCartInput } from '@/domain/use-cases/cart/GetCart';

import type { Cart } from '@/domain/entities/Cart';
import type { CartItem } from '@/domain/entities/CartItem';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';

export interface CartDeps {
  cartRepository: CartRepository;
  productRepository: ProductRepository;
  addItemToCart: (input: AddItemToCartInput) => Promise<CartItem>;
  removeFromCart: (input: RemoveFromCartInput) => Promise<void>;
  updateCartItemQuantity: (input: UpdateCartItemQuantityInput) => Promise<void>;
  clearCart: (input: ClearCartInput) => Promise<void>;
  getCart: (input: GetCartInput) => Promise<Cart>;
}

/**
 * Build a fully-wired set of cart dependencies. Safe to call multiple
 * times per request — repositories are cheap to instantiate and the
 * underlying PrismaClient is a global singleton.
 */
export function getCartDeps(): CartDeps {
  const cartRepository = new PrismaCartRepository();
  const productRepository = new PrismaProductRepository();

  return {
    cartRepository,
    productRepository,

    addItemToCart: (input) => addItemToCartUseCase(input, { cartRepository, productRepository }),

    removeFromCart: (input) => removeFromCartUseCase(input, { cartRepository }),

    updateCartItemQuantity: (input) =>
      updateCartItemQuantityUseCase(input, { cartRepository, productRepository }),

    clearCart: (input) => clearCartUseCase(input, { cartRepository }),

    getCart: (input) => getCartUseCase(input, { cartRepository }),
  };
}
