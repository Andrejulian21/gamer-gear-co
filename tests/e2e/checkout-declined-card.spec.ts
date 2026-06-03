import { test, expect } from '@playwright/test';
import {
  createTestUser,
  createTestProduct,
  createTestOrder,
  getOrderByReference,
  getCartItemCount,
  getTestPrisma,
  cleanupE2EOrders,
  cleanupE2EProduct,
} from './helpers/db';
import { buildWompiWebhookPayload, signWebhookPayload } from './helpers/wompi';

/**
 * Declined card E2E.
 *
 * Validates the FAILED branch of the payment lifecycle end-to-end:
 *
 *   1. A PENDING order exists in the DB (we seed it directly — the
 *      checkout UI is owned by beta and we don't depend on it here).
 *   2. Wompi delivers a webhook with status DECLINED.
 *   3. The webhook is verified, the use case runs, the order goes to
 *      FAILED, and the user's cart is preserved.
 *
 * Important DB invariants the test asserts (matching the use case
 * contract from `ProcessPaymentResult.ts`):
 *   - On FAILED: order.status = FAILED. The use case does NOT clear
 *     the cart and does NOT decrement stock — both effects are
 *     reserved for the APPROVED branch.
 *   - Idempotent: re-firing the same DECLINED webhook is a no-op.
 *
 * Status codes from Wompi we treat as DECLINED-equivalent:
 *   DECLINED, VOIDED, ERROR — each gets its own subtest so a future
 *   regression in the status mapping is caught quickly.
 */

const E2E_USER_EMAIL = 'e2e-declined@example.com';
const E2E_USER_PASSWORD = 'Declined1234!';
const E2E_PRODUCT_SLUG = 'e2e-declined-product';

test.describe.serial('Checkout declined-card webhook', () => {
  let userId: string;
  let productId: string;

  test.beforeAll(async () => {
    const user = await createTestUser({
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
      name: 'E2E Declined',
    });
    const product = await createTestProduct({
      slug: E2E_PRODUCT_SLUG,
      name: 'E2E Declined Product',
      price: 50_000,
      stock: 5,
    });
    userId = user.id;
    productId = product.id;
  });

  test.afterAll(async () => {
    await cleanupE2EOrders('e2e-declined-');
    await cleanupE2EProduct(E2E_PRODUCT_SLUG);
  });

  for (const wompiStatus of ['DECLINED', 'VOIDED', 'ERROR'] as const) {
    test(`${wompiStatus}: order transitions PENDING -> FAILED, cart preserved, stock unchanged`, async ({
      request,
    }) => {
      const prisma = getTestPrisma();

      // Seed: user has a cart item and a PENDING order
      await prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        update: { quantity: 1 },
        create: { userId, productId, quantity: 1 },
      });
      const cartBefore = await getCartItemCount(userId);
      expect(cartBefore).toBe(1);

      const productBefore = await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { stock: true },
      });

      const reference = `e2e-declined-${wompiStatus.toLowerCase()}-${Date.now()}`;
      await createTestOrder({
        userId,
        wompiReference: reference,
        items: [{ productId, quantity: 1, price: 50_000 }],
        status: 'PENDING',
      });

      // First webhook delivery: transition PENDING -> FAILED
      const body = JSON.stringify(
        buildWompiWebhookPayload({ reference, status: wompiStatus, amountInCents: 5_000_000 }),
      );
      const headers = signWebhookPayload({ body });

      const res = await request.post('/api/wompi/webhook', { headers, data: body });
      expect(res.status()).toBe(200);
      const json = (await res.json()) as { ok: boolean; status?: string };
      expect(json).toEqual({ ok: true, status: 'FAILED' });

      const order = await getOrderByReference(reference);
      expect(order?.status).toBe('FAILED');

      // Cart preserved (use case only clears cart on APPROVED)
      const cartAfter = await getCartItemCount(userId);
      expect(cartAfter).toBe(1);

      // Stock unchanged (no decrement on FAILED)
      const productAfter = await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { stock: true },
      });
      expect(productAfter.stock).toBe(productBefore.stock);

      // Idempotency: re-firing the same webhook should be a no-op
      // (the use case returns the already-FAILED order unchanged).
      const replayHeaders = signWebhookPayload({ body });
      const replay = await request.post('/api/wompi/webhook', {
        headers: replayHeaders,
        data: body,
      });
      expect(replay.status()).toBe(200);
      const orderStill = await getOrderByReference(reference);
      expect(orderStill?.status).toBe('FAILED');
    });
  }

  test('rejects unsigned webhook with 400', async ({ request }) => {
    const body = JSON.stringify(
      buildWompiWebhookPayload({ reference: 'whatever', status: 'DECLINED' }),
    );
    const res = await request.post('/api/wompi/webhook', {
      headers: { 'content-type': 'application/json' },
      data: body,
    });
    expect(res.status()).toBe(400);
  });

  test('rejects webhook with tampered body (signature was computed for different body) with 401', async ({
    request,
  }) => {
    const originalBody = JSON.stringify(
      buildWompiWebhookPayload({ reference: 'whatever', status: 'DECLINED' }),
    );
    const headers = signWebhookPayload({ body: originalBody });
    // Tamper: send a DIFFERENT body than what was signed
    const tamperedBody = originalBody.replace('DECLINED', 'APPROVED');
    const res = await request.post('/api/wompi/webhook', { headers, data: tamperedBody });
    expect(res.status()).toBe(401);
  });

  test('UI: /orders/[id] shows the FAILED badge', async ({ page, request }) => {
    // This subtest depends on beta's /orders/[id] page. Probe first.
    const probe = await page.request.get('/orders', { failOnStatusCode: false });
    test.skip(
      probe.status() === 404,
      'Depends on /orders/[id] (owned by beta). Skipping until beta lands the page.',
    );

    const prisma = getTestPrisma();
    // Fresh order so this test is independent of the loops above
    const reference = `e2e-declined-ui-${Date.now()}`;
    const order = await createTestOrder({
      userId,
      wompiReference: reference,
      items: [{ productId, quantity: 1, price: 50_000 }],
      status: 'PENDING',
    });

    const body = JSON.stringify(buildWompiWebhookPayload({ reference, status: 'DECLINED' }));
    const headers = signWebhookPayload({ body });
    await request.post('/api/wompi/webhook', { headers, data: body });

    // Log in as the order owner and visit the order page
    await page.goto('/login');
    await page.getByLabel('Email').fill(E2E_USER_EMAIL);
    await page.getByLabel('Contraseña').fill(E2E_USER_PASSWORD);
    await Promise.all([
      page.waitForURL('**/', { timeout: 15_000 }),
      page.getByRole('button', { name: /Ingresar/i }).click(),
    ]);

    await page.goto(`/orders/${order.id}`);
    await expect(page.getByText(/FAILED|Fallido|Rechazado/i).first()).toBeVisible();

    // Confirm DB still says FAILED at end of test
    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });
    expect(dbOrder?.status).toBe('FAILED');
  });
});
