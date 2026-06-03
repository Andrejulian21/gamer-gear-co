'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';

/**
 * Global error boundary for the App Router root.
 *
 * Catches any uncaught error in the (shop) / (admin) / (auth) / account
 * trees when the closest segment-level error.tsx is missing. The
 * segment-level error.tsx files (e.g. (shop)/error.tsx) take priority
 * and render first — this one is the last line of defense.
 *
 * Why router.refresh() instead of reset():
 *   The global boundary sits above a server-component tree. A "reset"
 *   would try to re-render the same segment in-place, which sometimes
 *   fails to clear transient server errors (db blips, etc.). A full
 *   `router.refresh()` re-runs the route handlers, which is the
 *   behavior we want for a top-level boundary.
 *
 * The error is logged once on mount; we deliberately don't re-throw —
 * that would trigger Next's dev-only error overlay and the user would
 * see a flash of the dev error page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full text-destructive"
      >
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Encontramos un problema inesperado. Podés intentar recargar la página o volver al inicio.
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
          data-testid="global-error-reload"
        >
          Recargar
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
