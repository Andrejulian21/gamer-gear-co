/**
 * Tests for the `authorized` callback in `auth.config.ts`.
 *
 * This callback runs in the Next.js middleware (Edge runtime) so we
 * must NOT touch Prisma / Node-only APIs here. The tests pass a
 * mock `auth` object that mimics what NextAuth provides at runtime.
 *
 * We import `authConfig` and call `authorized` with synthetic
 * `request` objects to verify the routing decisions:
 *   - /admin/* requires ADMIN role; anonymous → /login, non-admin → /
 *   - /account and /cart require login; anonymous users are redirected
 *   - /login and /register redirect already-signed-in users to /
 *   - everything else is allowed through
 */
import { describe, it, expect } from 'vitest';
import { authConfig } from '../auth.config';

type AuthUser = { id: string; role: 'USER' | 'ADMIN'; email?: string | null; name?: string | null };

// The middleware reads `request.nextUrl` (a WHATWG URL with a
// `pathname` and `searchParams` getter). We build a minimal mock
// that exposes the same surface — the production code only uses
// `pathname`, `search`, and `searchParams.get`.
const makeRequest = (pathname: string, search = ''): { nextUrl: URL } => {
  const nextUrl = new URL(`https://example.com${pathname}${search}`);
  return { nextUrl };
};

const authFor = (user: AuthUser | null) => ({ user });

const isRedirect = (value: unknown): value is Response =>
  value instanceof Response && value.status >= 300 && value.status < 400;

describe('authConfig.callbacks.authorized', () => {
  // The callback signature uses NextAuth's internal types (NextRequest
  // and Session). We pass a minimal cast so the test stays focused on
  // the routing logic rather than on building a full NextRequest /
  // Session pair. The shape we actually use (request.nextUrl.pathname
  // and auth.user.role) is covered by the existing auth.config.ts
  // type extensions in src/types/next-auth.d.ts.
  const authorized = authConfig.callbacks.authorized as unknown as (args: {
    auth: { user: AuthUser | null };
    request: { nextUrl: URL };
  }) => boolean | Response;

  describe('/admin/* gating', () => {
    it('redirects anonymous users to /login with ?next=', () => {
      const result = authorized({
        auth: authFor(null),
        request: makeRequest('/admin'),
      });

      expect(isRedirect(result)).toBe(true);
      const location = (result as Response).headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('next=%2Fadmin');
    });

    it('redirects non-admin (USER) users to / (breaks login redirect loop)', () => {
      const result = authorized({
        auth: authFor({ id: 'u1', role: 'USER' }),
        request: makeRequest('/admin/products'),
      });

      expect(isRedirect(result)).toBe(true);
      const location = (result as Response).headers.get('location');
      // Non-admin signed-in users go to / (not /login) to avoid a
      // redirect loop with /login bouncing logged-in users via `next`.
      expect(location).toMatch(/\/$/);
    });

    it('allows ADMIN users through', () => {
      const result = authorized({
        auth: authFor({ id: 'admin-1', role: 'ADMIN' }),
        request: makeRequest('/admin'),
      });

      expect(result).toBe(true);
    });

    it('allows ADMIN users through deep admin paths', () => {
      const result = authorized({
        auth: authFor({ id: 'admin-1', role: 'ADMIN' }),
        request: makeRequest('/admin/orders/abc-123'),
      });

      expect(result).toBe(true);
    });
  });

  describe('/account and /cart gating', () => {
    it('redirects anonymous /account to /login', () => {
      const result = authorized({
        auth: authFor(null),
        request: makeRequest('/account'),
      });
      expect(isRedirect(result)).toBe(true);
    });

    it('allows signed-in USER to view /account', () => {
      const result = authorized({
        auth: authFor({ id: 'u1', role: 'USER' }),
        request: makeRequest('/account'),
      });
      expect(result).toBe(true);
    });

    it('redirects anonymous /cart to /login', () => {
      const result = authorized({
        auth: authFor(null),
        request: makeRequest('/cart'),
      });
      expect(isRedirect(result)).toBe(true);
    });

    it('allows signed-in USER to view /cart', () => {
      const result = authorized({
        auth: authFor({ id: 'u1', role: 'USER' }),
        request: makeRequest('/cart'),
      });
      expect(result).toBe(true);
    });
  });

  describe('auth pages when already signed in', () => {
    it('redirects signed-in USER from /login back to / (or next param)', () => {
      const result = authorized({
        auth: authFor({ id: 'u1', role: 'USER' }),
        request: makeRequest('/login'),
      });
      expect(isRedirect(result)).toBe(true);
      const location = (result as Response).headers.get('location');
      expect(location).toMatch(/\/$/);
    });

    it('honors a safe ?next= param when redirecting from /login', () => {
      const result = authorized({
        auth: authFor({ id: 'u1', role: 'USER' }),
        request: makeRequest('/login', '?next=%2Faccount'),
      });
      expect(isRedirect(result)).toBe(true);
      const location = (result as Response).headers.get('location');
      expect(location).toContain('/account');
    });
  });

  describe('public paths', () => {
    it('allows / through for anonymous users', () => {
      const result = authorized({
        auth: authFor(null),
        request: makeRequest('/'),
      });
      expect(result).toBe(true);
    });

    it('allows /products through for anonymous users', () => {
      const result = authorized({
        auth: authFor(null),
        request: makeRequest('/products'),
      });
      expect(result).toBe(true);
    });
  });
});
