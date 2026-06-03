import { describe, it, expect } from 'vitest';
import { createHash, timingSafeEqual } from 'node:crypto';
import { verifyWompiWebhookSignature } from '../verify-webhook';

const computeSignature = (secret: string, timestamp: string, body: string): string =>
  createHash('sha256')
    .update(secret + timestamp + body)
    .digest('hex');

const NOW_MS = 1_700_000_000_000; // fixed "now" for deterministic tests
const TIMESTAMP = String(Math.floor(NOW_MS / 1000)); // 1_700_000_000

describe('verifyWompiWebhookSignature', () => {
  it('returns true for a valid signature within the time window', () => {
    const body = '{"event":"transaction.updated","data":{}}';
    const secret = 'events-secret-123';
    const signature = computeSignature(secret, TIMESTAMP, body);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: TIMESTAMP,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(true);
  });

  it('returns false when the signature does not match the body', () => {
    const body = '{"event":"transaction.updated"}';
    const secret = 'events-secret-123';
    // Signature was computed for a DIFFERENT body
    const signature = computeSignature(secret, TIMESTAMP, '{"event":"something.else"}');

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: TIMESTAMP,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('returns false when the signature was computed with a different secret', () => {
    const body = '{"event":"x"}';
    const signature = computeSignature('other-secret', TIMESTAMP, body);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: TIMESTAMP,
        body,
        secret: 'events-secret-123',
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('returns false when the timestamp is older than 5 minutes (replay protection)', () => {
    const body = '{"event":"x"}';
    const secret = 's';
    const oldTimestamp = String(Math.floor((NOW_MS - 6 * 60 * 1000) / 1000));
    const signature = computeSignature(secret, oldTimestamp, body);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: oldTimestamp,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('returns false when the timestamp is more than 5 minutes in the future', () => {
    const body = '{"event":"x"}';
    const secret = 's';
    const futureTimestamp = String(Math.floor((NOW_MS + 6 * 60 * 1000) / 1000));
    const signature = computeSignature(secret, futureTimestamp, body);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: futureTimestamp,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('accepts a timestamp at exactly 5 minutes old (boundary)', () => {
    const body = '{"event":"x"}';
    const secret = 's';
    const ts = String(Math.floor((NOW_MS - 5 * 60 * 1000) / 1000));
    const signature = computeSignature(secret, ts, body);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: ts,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(true);
  });

  it('returns false for an empty body when the signature was computed for a different body', () => {
    // An empty body with a *matching* signature would actually be valid
    // (no Wompi rule forbids empty bodies). What we DO forbid is a body
    // that doesn't match the signature — that is the security property.
    const secret = 's';
    const signature = computeSignature(secret, TIMESTAMP, 'not-empty');

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: TIMESTAMP,
        body: '',
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('returns false when the body is tampered (signature matches a different body)', () => {
    const secret = 's';
    const originalBody = '{"event":"x","amount":1000}';
    const signature = computeSignature(secret, TIMESTAMP, originalBody);

    expect(
      verifyWompiWebhookSignature({
        signature,
        timestamp: TIMESTAMP,
        body: '{"event":"x","amount":9999}', // tampered
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('returns false when the signature has a different length than the expected hash', () => {
    expect(
      verifyWompiWebhookSignature({
        signature: 'short',
        timestamp: TIMESTAMP,
        body: 'body',
        secret: 's',
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('uses timing-safe comparison (no early-return on first byte mismatch)', () => {
    // We can't directly observe timing in unit tests, but we can verify
    // behaviorally: a signature that differs in the first character but
    // matches the expected LENGTH should still return false, with no
    // exception thrown by a naive byte-by-byte compare.
    const body = '{"event":"x"}';
    const secret = 's';
    const goodSignature = computeSignature(secret, TIMESTAMP, body);
    // Flip the first character of the signature
    const badFirstChar = (goodSignature[0] === 'a' ? 'b' : 'a') + goodSignature.slice(1);

    expect(badFirstChar.length).toBe(goodSignature.length);
    expect(
      verifyWompiWebhookSignature({
        signature: badFirstChar,
        timestamp: TIMESTAMP,
        body,
        secret,
        now: NOW_MS,
      }),
    ).toBe(false);
  });

  it('timingSafeEqual on equal-length mismatched buffers returns false (sanity)', () => {
    // Sanity check that the timingSafeEqual function used in the impl
    // does the right thing for our use case.
    const a = Buffer.from('aaaa');
    const b = Buffer.from('bbbb');
    expect(timingSafeEqual(a, b)).toBe(false);
  });
});
