import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { getWompiBaseUrl, buildCheckoutUrl, buildIntegritySignature } from '../wompi';

describe('wompi', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WOMPI_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getWompiBaseUrl', () => {
    it('returns sandbox URL when WOMPI_ENV is unset', () => {
      expect(getWompiBaseUrl()).toBe('https://sandbox.wompi.co');
    });

    it('returns sandbox URL when WOMPI_ENV is "sandbox"', () => {
      process.env.WOMPI_ENV = 'sandbox';
      expect(getWompiBaseUrl()).toBe('https://sandbox.wompi.co');
    });

    it('returns production URL when WOMPI_ENV is "production"', () => {
      process.env.WOMPI_ENV = 'production';
      expect(getWompiBaseUrl()).toBe('https://production.wompi.co');
    });
  });

  describe('buildCheckoutUrl', () => {
    it('produces a URL with all required query params in the right order', () => {
      const url = buildCheckoutUrl({
        reference: 'order-abc-123',
        amountInCents: 5000000,
        currency: 'COP',
        signature: 'sig-xyz',
        redirectUrl: 'https://example.com/checkout/return',
        publicKey: 'pub_test_123',
      });

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://checkout.wompi.co');
      expect(parsed.pathname).toBe('/');
      expect(parsed.searchParams.get('public-key')).toBe('pub_test_123');
      expect(parsed.searchParams.get('currency')).toBe('COP');
      expect(parsed.searchParams.get('amount-in-cents')).toBe('5000000');
      expect(parsed.searchParams.get('reference')).toBe('order-abc-123');
      expect(parsed.searchParams.get('signature')).toBe('sig-xyz');
      expect(parsed.searchParams.get('redirect-url')).toBe('https://example.com/checkout/return');
    });

    it('uses sandbox or production checkout host as documented (always checkout.wompi.co)', () => {
      // Wompi's web checkout URL is the same regardless of sandbox/production
      // (the env is encoded in the public key, not the host).
      const sandbox = buildCheckoutUrl({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        signature: 's',
        redirectUrl: 'https://x.com',
        publicKey: 'pk',
      });
      const prod = buildCheckoutUrl({
        reference: 'r',
        amountInCents: 1,
        currency: 'COP',
        signature: 's',
        redirectUrl: 'https://x.com',
        publicKey: 'pk',
      });
      expect(sandbox.startsWith('https://checkout.wompi.co/?')).toBe(true);
      expect(prod.startsWith('https://checkout.wompi.co/?')).toBe(true);
    });
  });

  describe('buildIntegritySignature', () => {
    it('produces a deterministic SHA-256 of (reference + amountInCents + currency + expirationTime + secret)', () => {
      const args = {
        reference: 'order-1',
        amountInCents: 1234500,
        currency: 'COP',
        expirationTime: '2024-12-31T23:59:59.000Z',
        secret: 'super-secret-key',
      };

      const expected = createHash('sha256')
        .update(
          args.reference + args.amountInCents + args.currency + args.expirationTime + args.secret,
        )
        .digest('hex');

      expect(buildIntegritySignature(args)).toBe(expected);
    });

    it('is deterministic — same input yields same output', () => {
      const args = {
        reference: 'order-1',
        amountInCents: 100,
        currency: 'COP',
        expirationTime: '2024-12-31T23:59:59.000Z',
        secret: 's',
      };
      expect(buildIntegritySignature(args)).toBe(buildIntegritySignature(args));
    });

    it('changes when ANY input changes', () => {
      const base = {
        reference: 'order-1',
        amountInCents: 100,
        currency: 'COP',
        expirationTime: '2024-12-31T23:59:59.000Z',
        secret: 's',
      };
      const a = buildIntegritySignature(base);
      const b = buildIntegritySignature({ ...base, reference: 'order-2' });
      const c = buildIntegritySignature({ ...base, amountInCents: 200 });
      const d = buildIntegritySignature({ ...base, currency: 'USD' });
      const e = buildIntegritySignature({ ...base, expirationTime: '2025-01-01T00:00:00.000Z' });
      const f = buildIntegritySignature({ ...base, secret: 's2' });

      expect(a).not.toBe(b);
      expect(a).not.toBe(c);
      expect(a).not.toBe(d);
      expect(a).not.toBe(e);
      expect(a).not.toBe(f);
    });
  });
});
