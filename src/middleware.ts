import NextAuth from 'next-auth';
import { authConfig } from '@/infrastructure/auth/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all paths except: api/auth, _next/static, _next/image, favicon, public files
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
