import { notFound } from 'next/navigation';
import { auth } from '@/infrastructure/auth/auth';
import { AdminSidebar } from './_components/admin-sidebar';

export const metadata = {
  title: 'Admin — Gamer Gear Colombia',
  description: 'Panel de administración de la tienda.',
  robots: { index: false, follow: false },
};

/**
 * Admin layout (Phase 5, B1).
 *
 * Auth gate: defense in depth on top of the middleware. Middleware
 * already redirects non-admins to /login; this server component
 * re-checks the role and `notFound()`s if anything is amiss. Two
 * reasons we keep both:
 *   1. Middleware can be bypassed in some edge cases (e.g. direct
 *      path hits from a node runtime).
 *   2. If a non-admin signs in while a tab has /admin cached, we
 *      want a clean 404 instead of a flash of admin UI.
 *
 * The layout is intentionally minimal: zinc-950 background, single
 * accent color, sidebar + main column. No shop navbar / footer.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
