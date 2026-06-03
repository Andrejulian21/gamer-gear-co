'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';

/**
 * Admin section error boundary (Phase 7).
 *
 * Mirrors the global error boundary but tuned for the admin shell:
 * the (admin) layout already provides the AdminSidebar, so this
 * renders inside the main column. The zinc-950 + zinc-900/40
 * palette matches the admin theme so the error doesn't flash bright
 * on a dark page.
 *
 * Why router.refresh():
 *   Same rationale as the global error — admin pages are deeply
 *   server-component-driven and a full refresh re-runs the route
 *   handlers, which is what we want for transient server errors.
 *
 * Logging: console.error so the dev / Vercel runtime picks it up.
 * We deliberately don't re-throw.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Admin section error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 text-destructive"
      >
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        No pudimos cargar esta sección del panel. Probá recargar o volvé al dashboard.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Error: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          size="lg"
          onClick={() => {
            reset();
            router.refresh();
          }}
          data-testid="admin-error-reload"
        >
          Recargar
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/admin">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
