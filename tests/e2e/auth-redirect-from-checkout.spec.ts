import { test, expect } from '@playwright/test';

/**
 * Auth-gated checkout E2E.
 *
 * Visiting `/checkout` while unauthenticated MUST bounce the user to
 * `/login` with a `next` query param pointing back at /checkout.
 * Without this, the user signs in and lands at `/` and has to navigate
 * back to checkout from scratch — a known conversion killer.
 *
 * The redirect contract is enforced by `auth.config.ts` (NextAuth's
 * `authorized` callback). The protected-paths list is curated there;
 * `/checkout` should be in that list. If beta has not added it yet,
 * this test will fail with a clear assertion mismatch — that failure
 * IS the signal beta needs to wire up the gate.
 *
 * Auth.js convention here:
 *   - `next` is OUR convention (set by `auth.config.ts:authorized`)
 *   - `callbackUrl` is the legacy NextAuth convention
 * We accept either to stay future-proof.
 */

test.describe('Auth gate on /checkout', () => {
  test('unauthenticated visit to /checkout redirects to /login with next=/checkout', async ({
    page,
  }) => {
    // Probe first — if /checkout simply 404s (beta hasn't shipped it),
    // skip with an explanation. Once /checkout exists this will run.
    const probe = await page.request.get('/checkout', {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    const probeStatus = probe.status();
    test.skip(
      probeStatus === 404,
      'Depends on /checkout (owned by beta). Skipping until beta lands the page.',
    );

    await page.goto('/checkout');

    // Expect a redirect to /login. Two acceptable shapes:
    //   /login?next=/checkout
    //   /login?callbackUrl=%2Fcheckout
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/[?&](next|callbackUrl)=(%2F|\/)checkout/);
  });

  test('unauthenticated visit with a query string still redirects back to /checkout', async ({
    page,
  }) => {
    const probe = await page.request.get('/checkout', {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    test.skip(
      probe.status() === 404,
      'Depends on /checkout (owned by beta). Skipping until beta lands the page.',
    );

    // A user might deep-link with state in the query — make sure
    // the auth bounce still lands them on /login with /checkout as
    // the next target. Whether the query string is preserved in `next`
    // is owned by `auth.config.ts` and is not asserted here (some
    // implementations intentionally drop search to avoid open-redirect
    // edge cases). The MINIMUM contract we enforce: redirect happens
    // and /checkout is the next target.
    await page.goto('/checkout?intent=immediate');

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    const next = url.searchParams.get('next') ?? url.searchParams.get('callbackUrl');
    expect(next).toBeTruthy();
    expect(decodeURIComponent(next!)).toContain('/checkout');
  });
});
