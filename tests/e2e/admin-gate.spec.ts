import { test, expect } from '@playwright/test';

import { loginAs } from './helpers/auth';
import { loginAsAdmin } from './helpers/admin';

/**
 * Admin-gate E2E — Phase 5 (C2).
 *
 * Validates the admin middleware contract from three angles:
 *   1. Anonymous user -> redirected to /login.
 *   2. Non-admin (USER role) -> redirected to /login (defense in
 *      depth: the auth.config.ts `authorized` callback bounces
 *      non-admins to /login so we don't leak the existence of the
 *      admin area).
 *   3. ADMIN user -> the admin pages render a 200.
 *
 * The seeded users (`prisma/seed.ts`) are used:
 *   - admin@gamerstore.co / Admin123!
 *   - juan@example.com / User1234!
 *
 * `/admin/dashboard` is owned by beta (the dashboard page itself
 * is shipped by beta). If beta has not landed the page yet, the
 * test for that route is skipped with a clear annotation — the
 * other two routes (`/admin/orders`, `/admin/users`) are owned by
 * gamma and MUST render.
 */

const ADMIN_USER_EMAIL = 'admin@gamerstore.co';
const NORMAL_USER_EMAIL = 'juan@example.com';
const NORMAL_USER_PASSWORD = 'User1234!';

test.describe('Admin middleware gate', () => {
  test('anonymous visit to /admin is redirected to /login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);
    // The `next` query param should preserve the original path so
    // the user lands back here after sign-in.
    const url = new URL(page.url());
    const next = url.searchParams.get('next') ?? url.searchParams.get('callbackUrl');
    expect(next).toBeTruthy();
    expect(decodeURIComponent(next!)).toContain('/admin');
  });

  test('USER (non-admin) visit to /admin is redirected to /login', async ({ page, request }) => {
    await loginAs(page, NORMAL_USER_EMAIL, NORMAL_USER_PASSWORD);

    // We assert the middleware's first response (302 -> /login) with
    // `maxRedirects: 0` to avoid a redirect loop: the `/login` page
    // bounces a logged-in user back to the `next` target, and the
    // middleware will keep refusing non-admins. Detecting the
    // initial 302 is the cleanest assertion of the gate's intent.
    const response = await request.get('/admin', { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    const location = response.headers()['location'] ?? '';
    expect(location).toMatch(/\/login/);
  });

  test('ADMIN can visit /admin/orders and see the list page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');

    // We must NOT be redirected.
    await expect(page).toHaveURL(/\/admin\/orders/);

    // The orders page renders an h1 with "Pedidos". Allow either
    // the empty state or the table — both are valid depending on
    // whether there are seeded orders in the DB.
    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible();
  });

  test('ADMIN can visit /admin/users and see the list page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/admin\/users/);

    await expect(page.getByRole('heading', { name: 'Usuarios', level: 1 })).toBeVisible();

    // The admin user from the seed MUST be visible in the list
    // (their account is part of every fresh DB). We probe for
    // the email text rather than the role pill so the assertion
    // is robust to badge re-styling.
    await expect(page.getByText(ADMIN_USER_EMAIL).first()).toBeVisible();
  });

  test('ADMIN visit to /admin/dashboard (depends on beta)', async ({ page }) => {
    // Probe whether beta has shipped /admin/dashboard. If not,
    // skip with a clear annotation rather than failing.
    const probe = await page.request.get('/admin/dashboard', {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    test.skip(
      probe.status() === 404,
      'Depends on /admin/dashboard (owned by beta). Skipping until beta lands the dashboard page.',
    );

    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    // Don't assert on a specific heading — beta owns the page
    // structure. We only assert that the page rendered something
    // (status 200, no redirect to /login).
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('POST /api/admin/upload requires ADMIN', async ({ request }) => {
    // 1. Anonymous -> 401.
    const anonResponse = await request.post('/api/admin/upload', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        },
        folder: 'products',
      },
    });
    expect(anonResponse.status()).toBe(401);

    // 2. Authenticated non-admin -> 401. We sign in with the
    //    customer account and re-use the same session cookie
    //    (Playwright request shares storage state with the page
    //    fixture when used inside a `page` test, so we run this
    //    as part of the page-scoped flow below).
  });

  test('POST /api/admin/upload as non-admin (USER) returns 401', async ({ page }) => {
    // Re-use the page session via `page.request` (storage-state
    // aware) so the auth cookie is forwarded to the API.
    await loginAs(page, NORMAL_USER_EMAIL, NORMAL_USER_PASSWORD);

    const response = await page.request.post('/api/admin/upload', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        },
        folder: 'products',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/admin/upload as ADMIN rejects bad folder (400)', async ({ page }) => {
    await loginAsAdmin(page);

    // Use `page.request` (not the test-scoped `request` fixture) to
    // guarantee the auth cookie is forwarded. The two fixtures
    // share the same BrowserContext in theory, but `page.request`
    // is the documented entry point for storage-state-aware calls
    // and avoids flake.
    const response = await page.request.post('/api/admin/upload', {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        },
        folder: 'invalid-folder',
      },
    });
    expect(response.status()).toBe(400);
  });
});
