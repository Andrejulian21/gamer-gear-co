import { MapPin } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAccountDeps } from '@/presentation/lib/account-deps';
import { AddressList } from '../_components/address-list';

export const metadata = {
  title: 'Mis direcciones — Gamer Gear Colombia',
  description: 'Administra las direcciones de envío guardadas en tu cuenta.',
};

/**
 * Addresses page (Phase 6).
 *
 * Server component. Fetches the user's addresses (default first)
 * and hands them to the AddressList (also a server component) which
 * renders the per-address cards (client components for the form /
 * mutation bits). Add-address lives in the same AddressList so the
 * "Agregar nueva" UI sits at the top of the same list.
 *
 * The /account layout already redirects to /login when the session
 * is missing, but the page re-reads auth() so we have the userId
 * for the data fetch.
 */
export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    // Defense in depth — the layout already redirects.
    return null;
  }

  const { listUserAddresses } = getAccountDeps();
  const addresses = await listUserAddresses({ userId: session.user.id });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
          <MapPin className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          Mis direcciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Guarda direcciones para usarlas en tus próximas compras. La predeterminada se seleccionará
          automáticamente en el checkout.
        </p>
      </header>

      <AddressList addresses={addresses} />
    </div>
  );
}
