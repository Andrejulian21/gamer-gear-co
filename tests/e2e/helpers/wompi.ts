/**
 * E2E helpers for the Wompi payment flow.
 *
 * Two responsibilities:
 *   1. Forge cryptographically valid webhook payloads in tests so we
 *      can hit `/api/wompi/webhook` directly without depending on the
 *      real Wompi sandbox (which is rate-limited and flaky in CI).
 *   2. Intercept browser navigation to the Wompi sandbox URL so the
 *      checkout-happy-path spec doesn't actually leave the app.
 *
 * The signing algorithm here MUST stay in lockstep with the verifier
 * at `src/infrastructure/payments/verify-webhook.ts`:
 *
 *     signature = SHA256(secret + timestamp + rawBody)
 *
 * `timestamp` is Unix epoch SECONDS (not ms) per Wompi conventions.
 *
 * The verifier has a 5-minute replay window — these helpers default
 * `timestamp` to "now" so tests don't accidentally generate stale
 * signatures.
 */

import { createHash } from 'node:crypto';
import type { Page, Route } from '@playwright/test';

export interface SignWebhookPayloadInput {
  /**
   * The raw body string. Must be the EXACT bytes the test will POST.
   * Re-stringifying parsed JSON in the test will produce different
   * whitespace / key order and break the signature.
   */
  body: string;
  /**
   * The same secret the server is configured with via
   * `WOMPI_EVENTS_SECRET`. Defaults to the test secret used by the
   * Playwright web server (see `playwright.config.ts`).
   */
  secret?: string;
  /**
   * Override timestamp (Unix epoch seconds). Defaults to `now` so the
   * signature lands inside the 5-minute replay window.
   */
  timestamp?: number;
}

export type SignedWebhookHeaders = Record<string, string> & {
  'x-request-timestamp': string;
  'x-signature': string;
  'content-type': 'application/json';
};

/**
 * Default test secret. Used when neither a per-call `secret` nor
 * the `WOMPI_EVENTS_SECRET` env var is set.
 *
 * Kept here AND in `playwright.config.ts` so that — when Playwright
 * spawns a fresh dev server — both the test signer and the verifier
 * agree without any developer intervention. Do NOT use the production
 * secret here.
 */
export const DEFAULT_TEST_WEBHOOK_SECRET = 'test-wompi-events-secret-do-not-use-in-prod';

/**
 * Resolve the secret to sign with. Priority:
 *   1. explicit `input.secret`
 *   2. `WOMPI_EVENTS_SECRET` from the test process env (loaded from
 *      `.env` by `playwright.config.ts`) — this matches a running
 *      dev server that already booted with the real secret
 *   3. `DEFAULT_TEST_WEBHOOK_SECRET` — only kicks in when Playwright
 *      spawns its own dev server with the override secret
 *
 * Reading from env lets us run E2E against a long-running dev server
 * (`reuseExistingServer: true`) without forcing the developer to swap
 * their `.env` secret out for the test one.
 */
const resolveSecret = (explicit?: string): string => {
  if (explicit) return explicit;
  if (process.env.WOMPI_EVENTS_SECRET) return process.env.WOMPI_EVENTS_SECRET;
  return DEFAULT_TEST_WEBHOOK_SECRET;
};

/**
 * Sign a webhook body and return ready-to-send HTTP headers.
 *
 * Usage:
 *   const body = JSON.stringify(payload);
 *   const headers = signWebhookPayload({ body });
 *   await request.post('/api/wompi/webhook', { headers, data: body });
 */
export const signWebhookPayload = (input: SignWebhookPayloadInput): SignedWebhookHeaders => {
  const secret = resolveSecret(input.secret);
  const timestamp = String(input.timestamp ?? Math.floor(Date.now() / 1000));
  const signature = createHash('sha256')
    .update(secret + timestamp + input.body)
    .digest('hex');
  return {
    'x-request-timestamp': timestamp,
    'x-signature': signature,
    'content-type': 'application/json',
  };
};

export interface WompiTransactionFixtureInput {
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING';
  /** Amount in cents (Wompi's native integer format). */
  amountInCents?: number;
  currency?: string;
  transactionId?: string;
  customerEmail?: string;
}

/**
 * Build a Wompi webhook payload that matches the shape declared in
 * the route's parser. Only the fields the route reads are required;
 * everything else is filled with realistic defaults so we don't
 * accidentally test against an unrealistic shape.
 */
export const buildWompiWebhookPayload = (input: WompiTransactionFixtureInput): unknown => {
  const transactionId = input.transactionId ?? `txn-${Math.random().toString(36).slice(2, 10)}`;
  const timestampSec = Math.floor(Date.now() / 1000);
  return {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: transactionId,
        status: input.status,
        reference: input.reference,
        amount_in_cents: input.amountInCents ?? 1_000_000,
        currency: input.currency ?? 'COP',
        customer_email: input.customerEmail ?? 'e2e@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      sent_at: new Date().toISOString(),
    },
    signature: {
      // Wompi includes an inline signature too; our verifier ignores
      // this field and uses the HTTP headers instead, but real
      // payloads always have it so we include it for realism.
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      timestamp: timestampSec,
      checksum: 'unused-by-our-verifier',
    },
    environment: 'sandbox' as const,
  };
};

/**
 * Stub navigation to the Wompi Web Checkout so the browser never
 * actually leaves the app. We return a 200 with a minimal HTML page
 * so any waitFor in the test doesn't time out.
 *
 * Pair with `page.route(...)` BEFORE triggering the redirect.
 */
export async function mockWompiCheckoutRedirect(page: Page): Promise<void> {
  await page.route(
    /https:\/\/(checkout|sandbox|production)\.wompi\.co\/.*/,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html><body><h1>[stub] wompi checkout</h1></body></html>',
      });
    },
  );
}
