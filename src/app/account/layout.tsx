import { redirect } from 'next/navigation';

import { auth } from '@/infrastructure/auth/auth';
import { AccountSidebar } from './_components/account-sidebar';

export const metadata = {
  title: 'Mi cuenta — Gamer Gear Colombia',
  description: 'Edita tu perfil, cambia tu contraseña y administra tus direcciones.',
};

/**
 * Account layout (Phase 6).
 *
 * Auth-gates every /account/* page in one place. Pages also
 * re-check the session as defense in depth.
 *
 * Renders the AccountSidebar on the left, the page content on the
 * right. On mobile the sidebar collapses above the content (single
 * column stack) — the sidebar is short enough that this is fine
 * without a Sheet primitive.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?next=%2Faccount');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
