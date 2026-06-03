import { z } from 'zod';
import Decimal from 'decimal.js';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import { EmptyCartError } from '@/domain/errors/OrderErrors';
import { ProductNotFoundError } from '@/domain/errors/CartErrors';
import type { Order } from '@/domain/entities/Order';

const SHIPPING_ADDRESS_SCHEMA = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
});

export const CreateOrderFromCartInputSchema = z.object({
  userId: z.string().min(1),
  shippingAddress: SHIPPING_ADDRESS_SCHEMA,
});

export type CreateOrderFromCartInput = z.infer<typeof CreateOrderFromCartInputSchema>;

export interface CreateOrderFromCartDeps {
  cartRepository: CartRepository;
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Create a new order from the user's current cart.
 *
 * - Fetches cart items; throws EmptyCartError if there are none.
 * - Looks up each product (throws ProductNotFoundError if any is missing).
 * - Computes total = sum(price * quantity), rounded to 2 decimals.
 * - Generates a UUID `wompiReference` (used as the merchant reference for
 *   the Wompi checkout).
 * - Persists the order with status PENDING and returns it.
 *
 * The cart is NOT cleared here — the cart is only cleared by the payment
 * webhook when the order transitions to PAID. This keeps the operation
 * safe: if payment never happens, the user can still see the cart.
 */
export const createOrderFromCart = async (
  input: CreateOrderFromCartInput,
  deps: CreateOrderFromCartDeps,
): Promise<Order> => {
  const parsed = CreateOrderFromCartInputSchema.parse(input);
  const { userId, shippingAddress } = parsed;

  const cartItems = await deps.cartRepository.findByUserId(userId);
  if (cartItems.length === 0) {
    throw new EmptyCartError(userId);
  }

  // Build a price map by fetching each product referenced in the cart.
  // We use a single pass with parallel lookups would be ideal for perf,
  // but the cart is small (<20 items) and we want fail-fast on missing
  // products, so we go sequentially.
  const items: { productId: string; quantity: number; price: number }[] = [];
  for (const cartItem of cartItems) {
    const product = await deps.productRepository.findById(cartItem.productId);
    if (!product) {
      throw new ProductNotFoundError(cartItem.productId);
    }
    items.push({
      productId: product.id,
      quantity: cartItem.quantity,
      price: product.price,
    });
  }

  const total = round2(
    items
      .reduce((acc, item) => acc.plus(new Decimal(item.price).times(item.quantity)), new Decimal(0))
      .toNumber(),
  );

  const wompiReference = crypto.randomUUID();

  return deps.orderRepository.create({
    userId,
    items,
    total,
    shippingAddress,
    status: 'PENDING',
    wompiReference,
  });
};
