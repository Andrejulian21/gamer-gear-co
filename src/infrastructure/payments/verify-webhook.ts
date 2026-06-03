/**
 * Wompi webhook signature verification.
 *
 * Wompi signs every webhook event with a SHA-256 hash:
 *
 *   signature = SHA256(secret + timestamp + rawBody)
 *
 * - `secret` is `WOMPI_EVENTS_SECRET` (server-only).
 * - `timestamp` is the Unix epoch seconds Wompi includes in the
 *   `x-event-timestamp` header.
 * - `rawBody` is the unparsed request body string (CRITICAL: the
 *   verifier MUST be called with the raw string, not the parsed
 *   JSON re-serialized — JSON re-serialization can change whitespace
 *   and key order, breaking the signature).
 *
 * Replay protection: we reject any timestamp more than 5 minutes away
 * from "now". This bounds the window in which a captured-and-replayed
 * webhook could be accepted.
 *
 * Comparison is timing-safe via `crypto.timingSafeEqual` to prevent
 * timing side-channel attacks that could leak the expected signature
 * byte-by-byte. Early-return on length mismatch is safe because the
 * length is itself non-secret.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const SHA256_HEX_LENGTH = 64; // 32 bytes hex = 64 chars

export interface VerifyWompiWebhookSignatureInput {
  signature: string;
  timestamp: string;
  body: string;
  secret: string;
  /**
   * Override "now" for deterministic tests. Defaults to `Date.now()`.
   * Must be a Unix epoch in MILLISECONDS.
   */
  now?: number;
}

/**
 * Verify a Wompi webhook signature. Returns true if the signature is
 * valid AND the timestamp is within the 5-minute replay window.
 */
export const verifyWompiWebhookSignature = (input: VerifyWompiWebhookSignatureInput): boolean => {
  const { signature, timestamp, body, secret } = input;
  const now = input.now ?? Date.now();

  // 1. Replay protection
  const tsMs = Number(timestamp) * 1000;
  if (!Number.isFinite(tsMs)) {
    return false;
  }
  if (Math.abs(now - tsMs) > REPLAY_WINDOW_MS) {
    return false;
  }

  // 2. Length check (safe to short-circuit — length is not secret)
  if (signature.length !== SHA256_HEX_LENGTH) {
    return false;
  }

  // 3. Recompute the expected signature
  const expected = createHash('sha256')
    .update(secret + timestamp + body)
    .digest('hex');

  // 4. Timing-safe compare on equal-length buffers
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
};
