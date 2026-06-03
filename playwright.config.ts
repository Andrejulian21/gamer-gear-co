import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

/**
 * Load `.env` BEFORE evaluating `webServer.env` and before tests
 * spawn. Playwright does not load .env by itself, so without this
 * the dev server's child process and the test process both come up
 * with no DATABASE_URL / NEXTAUTH_SECRET / etc.
 */
loadEnv({ path: path.resolve(__dirname, '.env') });

/**
 * Optional separate test database. Set `DATABASE_URL_TEST` in `.env`
 * to point at a throwaway Postgres (e.g.
 * `postgresql://postgres:postgres@localhost:5432/gamerstore_test`)
 * so E2E runs do not write to the dev DB.
 *
 * If `DATABASE_URL_TEST` is not set, E2E falls back to `DATABASE_URL`
 * — which works fine, but be aware tests will create/delete rows in
 * the dev DB (they always use the `e2e-` prefix for safety).
 */
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

/**
 * Fixed test secret for the Wompi webhook. Mirrors
 * `DEFAULT_TEST_WEBHOOK_SECRET` in `tests/e2e/helpers/wompi.ts`.
 *
 * We force this env var onto the Next.js dev server when Playwright
 * spawns it AND onto the test process so signed webhooks from tests
 * verify correctly regardless of what the developer has in `.env`.
 * NEVER set this value to the production secret.
 *
 * NOTE: when `reuseExistingServer` is true (local dev) AND a dev server
 * is already running, Playwright does NOT respawn it, so this env is
 * ignored on the SERVER side — the existing dev server keeps whatever
 * secret it was started with. The TEST signer also reads
 * `process.env.WOMPI_EVENTS_SECRET`, so when reusing a long-running
 * dev server make sure `WOMPI_EVENTS_SECRET` in your `.env` matches the
 * value below — OR kill the dev server so Playwright spawns a fresh one
 * with the test secret.
 */
const TEST_WOMPI_EVENTS_SECRET = 'test-wompi-events-secret-do-not-use-in-prod';

/**
 * Force the test process to use the test secret too. This keeps the
 * signer and verifier in sync when Playwright spawns the dev server
 * with the override above. When reusing an existing dev server, the
 * developer must ensure `WOMPI_EVENTS_SECRET` in `.env` already
 * matches `TEST_WOMPI_EVENTS_SECRET` — easiest is to set it in `.env`
 * locally during E2E work.
 */
process.env.WOMPI_EVENTS_SECRET = TEST_WOMPI_EVENTS_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Forward the (possibly test-swapped) DATABASE_URL to the
      // dev server so the app and the test process talk to the
      // same database.
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      // Override .env so the webhook verifier and the test signer
      // agree on a known secret. Do not change without also updating
      // DEFAULT_TEST_WEBHOOK_SECRET in tests/e2e/helpers/wompi.ts.
      WOMPI_EVENTS_SECRET: TEST_WOMPI_EVENTS_SECRET,
      // Forward Wompi checkout-related env vars so the checkout
      // server action can build the Web Checkout URL during the UI
      // E2E. Without these `createOrderAction` returns MISSING_ENV and
      // the form never redirects to wompi.co.
      NEXT_PUBLIC_WOMPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? '',
      WOMPI_PRIVATE_KEY: process.env.WOMPI_PRIVATE_KEY ?? '',
      WOMPI_REDIRECT_URL: process.env.WOMPI_REDIRECT_URL ?? '',
      // NextAuth needs its secret to sign JWTs; otherwise the
      // freshly-spawned dev server cannot validate logged-in sessions
      // during the UI E2E.
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      // Keep Node in development so error overlays and hot-reload work
      // as the developer expects when debugging a failing E2E.
      NODE_ENV: 'development',
      // Forward PATH so child processes can find node, pnpm, etc.
      PATH: process.env.PATH ?? '',
    },
  },
});
