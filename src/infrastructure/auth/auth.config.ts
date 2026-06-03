import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAccount = nextUrl.pathname.startsWith('/account');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnCart = nextUrl.pathname.startsWith('/cart');
      const isOnAuth =
        nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      // Admin routes require BOTH authentication AND the ADMIN role.
      // The role is encoded in the JWT (see `jwt` callback below), so
      // this check stays Edge-compatible — no Prisma / DB lookup.
      // A non-admin user is bounced to /login (the same response as
      // an unauthenticated user — we don't leak the existence of the
      // admin area to role-less users).
      if (isOnAdmin) {
        if (!isLoggedIn || auth?.user?.role !== 'ADMIN') {
          const loginUrl = new URL('/login', nextUrl);
          loginUrl.searchParams.set('next', nextUrl.pathname + nextUrl.search);
          return Response.redirect(loginUrl);
        }
        return true;
      }

      if (isOnAccount || isOnCart) {
        if (isLoggedIn) return true;
        // Bounce unauthenticated traffic to /login?next=<original path>
        // so the user lands back on the protected page after signing in.
        // searchParams.set will URL-encode the value once; do NOT
        // pre-encode or you'll get a double-encoded next=%252F...
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('next', nextUrl.pathname + nextUrl.search);
        return Response.redirect(loginUrl);
      }

      if (isOnAuth && isLoggedIn) {
        // If the user lands on /login while signed in, honor a safe `next`
        // query param (must be a same-origin path) before falling back to `/`.
        const nextParam = nextUrl.searchParams.get('next');
        const target = isSafeInternalPath(nextParam) ? nextParam! : '/';
        return Response.redirect(new URL(target, nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'USER' | 'ADMIN';
      }
      return session;
    },
  },
  providers: [], // Will be added in auth.ts (DB-dependent)
} satisfies NextAuthConfig;

/**
 * Validates a candidate `next` redirect target.
 *
 * Accepts only same-origin absolute paths so a malicious link like
 * `?next=https://evil.com` or `?next=//evil.com` can never bounce the
 * user off-site. Anything else falls back to `/`.
 */
function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false; // protocol-relative URL
  if (value.startsWith('/\\')) return false; // some browsers normalize \ to /
  return true;
}
