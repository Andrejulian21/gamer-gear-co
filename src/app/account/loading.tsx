import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Account dashboard loading skeleton (Phase 7).
 *
 * Mirrors the (real) /account page: header, two cards on top
 * (profile + password), then a "Recent orders" list with 3 rows.
 * The account layout (sidebar + main) is rendered by the
 * `account/layout.tsx` parent, so this skeleton sits inside the
 * main column only.
 *
 * role="status" + aria-label announce "Cargando tu cuenta" once.
 */
export default function AccountLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando tu cuenta">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile card */}
        <div
          aria-hidden="true"
          className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6"
        >
          <Skeleton className="h-5 w-24" />
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Password card */}
        <div
          aria-hidden="true"
          className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6"
        >
          <Skeleton className="h-5 w-32" />
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div
        aria-hidden="true"
        className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Separator />
        <ul role="list" className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-24" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
