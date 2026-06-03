'use server';

import { z } from 'zod';
import { auth } from '@/infrastructure/auth/auth';
import { getOrderDeps } from '@/presentation/lib/order-deps';
import { getCartDeps } from '@/presentation/lib/cart-deps';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { getTotalItems } from '@/domain/entities/Cart';
import { formatCOP } from '@/presentation/lib/price-format';
import { buildCheckoutUrl, buildIntegritySignature } from '@/infrastructure/payments/wompi';
import { EmptyCartError, OrderNotFoundError } from '@/domain/errors/OrderErrors';
import {
  InsufficientStockError,
  InvalidCartItemQuantityError,
  ProductNotFoundError,
} from '@/domain/errors/CartErrors';

/**
 * Error codes returned by checkout server actions.
 *
 * - `AUTH_REQUIRED` is consumed by the client to redirect to login.
 * - `EMPTY_CART` and `OUT_OF_STOCK` surface actionable messages.
 * - `INVALID_INPUT` catches malformed shipping-address submissions.
 * - `MISSING_ENV` means WOMPI_* env vars are not configured (server bug).
 * - `UNKNOWN` is the catch-all for unclassified failures.
 */
export type CheckoutErrorCode =
  | 'AUTH_REQUIRED'
  | 'EMPTY_CART'
  | 'OUT_OF_STOCK'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'MISSING_ENV'
  | 'UNKNOWN';

export type CreateOrderActionResult =
  | { ok: true; url: string; orderId: string }
  | { ok: false; error: CheckoutErrorCode; message?: string };

export type CheckoutSummary = {
  items: Array<{
    productId: string;
    slug: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    stock: number;
  }>;
  total: number;
  itemCount: number;
};

export type CheckoutSummaryResult =
  | { ok: true; summary: CheckoutSummary }
  | { ok: false; error: CheckoutErrorCode };

const SHIPPING_ADDRESS_SCHEMA = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre completo').max(120),
  phone: z.string().min(7, 'Ingresa un teléfono válido').max(40),
  email: z.string().email('Email inválido').max(160),
  street: z.string().min(5, 'Ingresa la dirección').max(200),
  city: z.string().min(2, 'Ingresa la ciudad').max(80),
  state: z.string().min(2, 'Ingresa el departamento').max(80),
  zipCode: z.string().min(3, 'Ingresa el código postal').max(20),
});

export type ShippingAddressInput = z.infer<typeof SHIPPING_ADDRESS_SCHEMA>;

function readEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Read and validate the Wompi env vars needed to build a checkout URL.
 *
 * Returns `null` if any required value is missing — the caller will
 * surface a `MISSING_ENV` error so the operator knows to fill in
 * `.env`. The private key is read from `WOMPI_PRIVATE_KEY` and
 * never leaves the server.
 */
function readWompiConfigOrNull(): {
  publicKey: string;
  privateKey: string;
  redirectUrlBase: string;
} | null {
  const publicKey = readEnv('NEXT_PUBLIC_WOMPI_PUBLIC_KEY');
  const privateKey = readEnv('WOMPI_PRIVATE_KEY');
  const redirectUrlBase = readEnv('WOMPI_REDIRECT_URL');

  if (!publicKey || !privateKey || !redirectUrlBase) return null;
  return { publicKey, privateKey, redirectUrlBase };
}

/**
 * Create a pending order from the user's cart and build the Wompi
 * checkout URL.
 *
 * Flow:
 *  1. Auth-gate: refuse if there is no session.
 *  2. Validate the shipping address (zod, same shape as the
 *     CreateOrderFromCart input on the domain side).
 *  3. Call `createOrderFromCart` from the order deps. This:
 *       - reads the cart
 *       - computes the total server-side (NEVER trust the client)
 *       - generates a UUID `wompiReference`
 *       - persists the order with status PENDING
 *  4. Build the integrity signature
 *     SHA256(reference + amountInCents + currency + expirationTime + secret)
 *     where expirationTime is one hour from now.
 *  5. Build the Wompi Web Checkout URL and return it to the client.
 *     The client performs `window.location.href = url` to navigate.
 *
 * The cart is NOT cleared here — that happens in the webhook when
 * the order transitions to PAID. This keeps the operation safe: if
 * payment never happens, the user can still see the cart.
 *
 * `WOMPI_REDIRECT_URL` is treated as a BASE — we append
 * `/orders/<orderId>` to it. Wompi will then redirect the user back
 * to that exact path (and append its own `?id=<transactionId>` query).
 */
export async function createOrderAction(
  shippingAddress: ShippingAddressInput,
): Promise<CreateOrderActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'AUTH_REQUIRED' };
  }

  const parsed = SHIPPING_ADDRESS_SCHEMA.safeParse(shippingAddress);
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT' };
  }
  const address = parsed.data;

  const wompi = readWompiConfigOrNull();
  if (!wompi) {
    return { ok: false, error: 'MISSING_ENV' };
  }

  // CreateOrderFromCart only needs the shipping structural fields
  // (no fullName, no email). fullName and email are for the order
  // confirmation email / future CRM sync — out of scope for the
  // domain input. We persist the form data alongside the order
  // for display on the order detail page.
  const shippingForDomain = {
    street: address.street,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    phone: address.phone,
  };

  const { createOrderFromCart } = getOrderDeps();
  let order;
  try {
    order = await createOrderFromCart({
      userId: session.user.id,
      shippingAddress: shippingForDomain,
    });
  } catch (err) {
    if (err instanceof EmptyCartError) return { ok: false, error: 'EMPTY_CART' };
    if (err instanceof InsufficientStockError) return { ok: false, error: 'OUT_OF_STOCK' };
    if (err instanceof InvalidCartItemQuantityError) return { ok: false, error: 'INVALID_INPUT' };
    if (err instanceof ProductNotFoundError) return { ok: false, error: 'NOT_FOUND' };
    if (err instanceof OrderNotFoundError) return { ok: false, error: 'NOT_FOUND' };
    return { ok: false, error: 'UNKNOWN' };
  }

  // The wompiReference is the link between the persisted Order and
  // the Wompi checkout session. It's a UUID generated by the use case.
  const reference = order.wompiReference;
  if (!reference) {
    // Defensive: CreateOrderFromCart always sets wompiReference, but
    // the Order type allows nullable. If it ever changes, fail loud.
    return { ok: false, error: 'UNKNOWN', message: 'Order missing wompiReference' };
  }

  const amountInCents = Math.round(order.total * 100);
  const currency = 'COP';
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const signature = buildIntegritySignature({
    reference,
    amountInCents,
    currency,
    expirationTime,
    secret: wompi.privateKey,
  });

  const checkoutUrl = buildCheckoutUrl({
    reference,
    amountInCents,
    currency,
    signature,
    redirectUrl: `${wompi.redirectUrlBase.replace(/\/+$/, '')}/orders/${order.id}`,
    publicKey: wompi.publicKey,
  });

  return { ok: true, url: checkoutUrl, orderId: order.id };
}

/**
 * Fetch the cart summary (items + total) for the authenticated user,
 * hydrated with product display data.
 *
 * This is a read-only server action used by the checkout page
 * server component to render the order summary. It mirrors the
 * hydration pattern used in the cart page.
 */
export async function getCheckoutSummaryAction(): Promise<CheckoutSummaryResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'AUTH_REQUIRED' };
  }

  const { getCart } = getCartDeps();
  const cart = await getCart({ userId: session.user.id });
  const itemCount = getTotalItems(cart);

  if (itemCount === 0) {
    return { ok: false, error: 'EMPTY_CART' };
  }

  const productRepo = new PrismaProductRepository();
  const products = await productRepo.findMany({ limit: 100 });
  const productById = new Map(products.map((p) => [p.id, p]));

  const items = cart.items
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product || product.images.length === 0) return null;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]!,
        unitPrice: product.price,
        quantity: item.quantity,
        stock: product.stock,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (items.length === 0) {
    return { ok: false, error: 'EMPTY_CART' };
  }

  const total = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);

  return {
    ok: true,
    summary: {
      items,
      total,
      itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    },
  };
}

/**
 * Re-export the price formatter for client components that need it
 * without pulling in the full lib path. Keeps the checkout form
 * self-contained.
 */
export { formatCOP };
