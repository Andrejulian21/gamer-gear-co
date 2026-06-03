import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';

/**
 * Account 404 — caught inside the /account layout.
 *
 * Used for any unknown /account subpath (e.g. /account/foo). Matches
 * the dark zinc-950 + lime-400 palette of the rest of the app and
 * the friendly Spanish copy convention of the other 404s.
 *
 * The /account layout is auth-gated, so by the time this renders the
 * user is already signed in — that's why the primary CTA points to
 * the account dashboard, not to /login.
 */
export default function AccountNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 text-muted-foreground"
      >
        <SearchX className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Sección no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La sección de tu cuenta que buscás no existe.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/account" data-testid="account-not-found-cta">
          Volver a mi cuenta
        </Link>
      </Button>
    </div>
  );
}
