/**
 * Wompi payment gateway helpers.
 *
 * Pure TypeScript — no SDK, no HTTP. Wompi is a Colombian payment
 * processor; their Web Checkout flow takes a URL with query params
 * and a SHA-256 integrity signature.
 *
 * Two distinct signatures are used:
 *  1. Integrity signature — sent to the Web Checkout as `signature=`.
 *     Algorithm: SHA256(reference + amountInCents + currency + expirationTime + secret)
 *     Per Wompi docs: https://docs.wompi.co/docs/colombia/web-checkout
 *  2. Webhook signature — sent by Wompi on the event channel.
 *     Algorithm: SHA256(secret + timestamp + body) — different.
 *     See `verify-webhook.ts`.
 *
 * Env vars (all server-side unless noted):
 *   WOMPI_ENV                = 'sandbox' | 'production' (default 'sandbox')
 *   WOMPI_PUBLIC_KEY         = server-safe public key
 *   NEXT_PUBLIC_WOMPI_PUBLIC_KEY = browser-safe public key (same value usually)
 *   WOMPI_PRIVATE_KEY        = server-only secret for integrity signing
 *   WOMPI_EVENTS_SECRET      = server-only secret for webhook verification
 *   WOMPI_REDIRECT_URL       = where to send user back after payment
 *
 * `processPaymentResult` (in the domain) handles webhook processing;
 * this file is purely about building the outbound checkout URL and
 * its integrity signature.
 */

import { createHash } from 'node:crypto';

export type WompiEnv = 'sandbox' | 'production';

const DEFAULT_ENV: WompiEnv = 'sandbox';

const SANDBOX_BASE_URL = 'https://sandbox.wompi.co';
const PRODUCTION_BASE_URL = 'https://production.wompi.co';

// Per Wompi docs, the Web Checkout URL is the same for both envs
// (the public key encodes the env). We keep this constant exported
// in case future API changes diverge the hosts.
export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/';

const readEnv = (key: string): string | undefined => process.env[key];

/**
 * Resolve and validate the Wompi environment.
 * Throws if WOMPI_ENV is set to something other than 'sandbox' or 'production'.
 */
const resolveWompiEnv = (): WompiEnv => {
  const raw = (readEnv('WOMPI_ENV') ?? DEFAULT_ENV).toLowerCase();
  if (raw === 'production') return 'production';
  if (raw === 'sandbox') return 'sandbox';
  throw new Error(`Invalid WOMPI_ENV: ${raw}. Must be 'sandbox' or 'production'.`);
};

/**
 * The Wompi REST API base URL for the current environment.
 *
 * Note: this is the API base, not the Web Checkout base. The Web
 * Checkout URL is a constant (`WOMPI_CHECKOUT_URL`) and is the same
 * for both envs.
 */
export const getWompiBaseUrl = (): string => {
  return resolveWompiEnv() === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
};

export interface BuildCheckoutUrlInput {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl: string;
  publicKey: string;
}

/**
 * Build the Wompi Web Checkout URL with all required query parameters.
 *
 * Per Wompi docs, the required params are:
 *   - public-key
 *   - currency
 *   - amount-in-cents
 *   - reference
 *   - signature (integrity)
 *   - redirect-url
 *
 * We use `URLSearchParams` (insertion-ordered) so the resulting query
 * string is deterministic and easy to compare in tests.
 */
export const buildCheckoutUrl = (input: BuildCheckoutUrlInput): string => {
  const params = new URLSearchParams();
  params.set('public-key', input.publicKey);
  params.set('currency', input.currency);
  params.set('amount-in-cents', String(input.amountInCents));
  params.set('reference', input.reference);
  params.set('signature', input.signature);
  params.set('redirect-url', input.redirectUrl);
  return `${WOMPI_CHECKOUT_URL}?${params.toString()}`;
};

export interface BuildIntegritySignatureInput {
  reference: string;
  amountInCents: number;
  currency: string;
  expirationTime: string;
  secret: string;
}

/**
 * Build the integrity signature for the Wompi Web Checkout.
 *
 * Algorithm (per Wompi docs):
 *   SHA256(reference + amountInCents + currency + expirationTime + secret)
 *
 * Concatenation is positional, no separator. The `expirationTime`
 * is an ISO 8601 timestamp (e.g. "2024-12-31T23:59:59.000Z") after
 * which the checkout session is no longer valid. The amount is in
 * cents (integer) and the currency is a 3-letter code (e.g. "COP").
 */
export const buildIntegritySignature = (input: BuildIntegritySignatureInput): string => {
  return createHash('sha256')
    .update(
      input.reference + input.amountInCents + input.currency + input.expirationTime + input.secret,
    )
    .digest('hex');
};
