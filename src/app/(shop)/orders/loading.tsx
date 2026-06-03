import { Skeleton } from '@/presentation/components/loading-skeleton';

/**
 * Orders list loading skeleton (Phase 7).
 *
 * Mirrors the /orders page: header, status-filter strip, then a
 * list of 3 order-card skeletons (the real page renders one card
 * per order). Each card row keeps the same vertical rhythm: package
 * icon, ID + status badge, date, total, chevron — so the user sees
 * the same shape that will hydrate.
 *
 * role="status" + aria-label announce "Cargando tus pedidos" once.
 */
export default function OrdersLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando tus pedidos"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="hidden h-8 w-32 sm:block" />
      </div>

      {/* Status filter strip */}
      <div
        aria-hidden="true"
        className="border-border/60 bg-card/50 flex gap-2 overflow-x-auto rounded-xl border p-2"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0" />
        ))}
      </div>

      {/* Order cards */}
      <ul role="list" aria-hidden="true" className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="border-border/60 bg-card/50 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="hidden h-12 w-12 shrink-0 rounded-md sm:block" />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end sm:gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
