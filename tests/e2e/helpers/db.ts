/**
 * E2E database helpers.
 *
 * These talk to the SAME Postgres the dev server uses. The dev server
 * is what serves both the app and the webhook endpoint under test, so
 * we cannot use a separate "test" database without also pointing the
 * dev server at it.
 *
 * Two design rules to keep tests safe alongside the seed data:
 *
 *   1. Always create test fixtures with deterministic prefixes (e.g.
 *      `e2e-` for emails, references, and ids) so they are easy to
 *      spot in the DB and trivially cleaned up.
 *   2. Test cleanup helpers ONLY delete rows that match the test
 *      prefix — never `deleteMany({})`. We do not want a stray E2E
 *      run wiping seed data.
 *
 * If/when a proper isolated test DB is introduced, swap the `prisma`
 * import for a test-scoped one and remove the prefix rules.
 */

import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let cached: PrismaClient | undefined;

/**
 * Lazy singleton — Playwright spawns one worker per test file by
 * default and we don't want to open a connection just to call helpers
 * that may not be exercised.
 */
export const getTestPrisma = (): PrismaClient => {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — required for E2E tests');
  }
  const adapter = new PrismaPg({ connectionString });
  cached = new PrismaClient({ adapter });
  return cached;
};

export interface CreateTestUserInput {
  email: string;
  password: string;
  name?: string;
}

/**
 * Idempotent test-user upsert. Returns the user id.
 * Hashes the password with the same cost factor as `prisma/seed.ts`
 * so logging in via the real `/login` form works.
 */
export async function createTestUser(
  input: CreateTestUserInput,
): Promise<{ id: string; email: string }> {
  const prisma = getTestPrisma();
  const hashed = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      email: input.email,
      password: hashed,
      name: input.name ?? input.email.split('@')[0],
      role: 'USER',
    },
    select: { id: true, email: true },
  });
  return user;
}

export interface CreateTestProductInput {
  /** Must start with `e2e-` so cleanup helpers can find it. */
  slug: string;
  name: string;
  price: number;
  stock: number;
  brandSlug?: string;
  categorySlug?: string;
}

/**
 * Idempotent test-product upsert. Reuses an existing brand and
 * category from the seed (we don't want to litter brands/categories
 * with E2E data).
 *
 * `price` is stored as Prisma.Decimal in the DB — caller passes a JS
 * number (e.g. `199.99`) and we convert here.
 */
export async function createTestProduct(
  input: CreateTestProductInput,
): Promise<{ id: string; slug: string }> {
  const prisma = getTestPrisma();
  const brand = await prisma.brand.findFirst({
    where: input.brandSlug ? { slug: input.brandSlug } : {},
    select: { id: true },
  });
  if (!brand) throw new Error('No brand found in DB — run `pnpm prisma:seed` first');
  const category = await prisma.category.findFirst({
    where: input.categorySlug ? { slug: input.categorySlug } : {},
    select: { id: true },
  });
  if (!category) throw new Error('No category found in DB — run `pnpm prisma:seed` first');

  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      price: new Prisma.Decimal(input.price),
      stock: input.stock,
    },
    create: {
      slug: input.slug,
      name: input.name,
      description: 'E2E test product — safe to delete',
      price: new Prisma.Decimal(input.price),
      stock: input.stock,
      // Cart page filters out items whose product has no images
      // (see src/app/(shop)/cart/page.tsx). A non-empty images array
      // is required for the cart row to render and the checkout CTA
      // to appear — without it the cart looks empty in the UI.
      images: ['https://placehold.co/400x400/000000/FFFFFF?text=E2E'],
      featured: false,
      brandId: brand.id,
      categoryId: category.id,
    },
    select: { id: true, slug: true },
  });
  return product;
}

export interface CreateTestOrderInput {
  userId: string;
  wompiReference: string;
  items: { productId: string; quantity: number; price: number }[];
  status?: 'PENDING' | 'PAID' | 'FAILED';
}

/**
 * Insert a PENDING order directly into the DB without going through
 * the UI. Useful for webhook-only tests that don't need to exercise
 * the full checkout form.
 */
export async function createTestOrder(input: CreateTestOrderInput): Promise<{
  id: string;
  wompiReference: string;
}> {
  const prisma = getTestPrisma();
  const total = input.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const order = await prisma.order.create({
    data: {
      userId: input.userId,
      total: new Prisma.Decimal(total),
      status: input.status ?? 'PENDING',
      wompiReference: input.wompiReference,
      shippingAddress: {
        street: '123 E2E St',
        city: 'Bogota',
        state: 'Cundinamarca',
        zipCode: '110111',
        phone: '+573000000000',
      },
      items: {
        create: input.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          price: new Prisma.Decimal(it.price),
        })),
      },
    },
    select: { id: true, wompiReference: true },
  });
  return { id: order.id, wompiReference: order.wompiReference! };
}

export async function getOrderByReference(reference: string): Promise<{
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  userId: string;
} | null> {
  const prisma = getTestPrisma();
  const order = await prisma.order.findUnique({
    where: { wompiReference: reference },
    select: { id: true, status: true, userId: true },
  });
  return order;
}

export async function getCartItemCount(userId: string): Promise<number> {
  const prisma = getTestPrisma();
  return prisma.cartItem.count({ where: { userId } });
}

/**
 * Best-effort cleanup helpers. Safe to call without arguments; will
 * only touch rows that match the E2E prefix conventions.
 */
export async function cleanupE2EOrders(referencePrefix = 'e2e-'): Promise<void> {
  const prisma = getTestPrisma();
  await prisma.order.deleteMany({
    where: { wompiReference: { startsWith: referencePrefix } },
  });
}

export async function cleanupE2EProduct(slug: string): Promise<void> {
  if (!slug.startsWith('e2e-')) {
    throw new Error(`Refusing to delete non-E2E product: ${slug}`);
  }
  const prisma = getTestPrisma();
  await prisma.product.deleteMany({ where: { slug } });
}
