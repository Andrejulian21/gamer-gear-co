import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Order detail loading skeleton (Phase 7).
 *
 * Mirrors the (real) /orders/[id] page: top nav row, header with
 * short id + status badge, products card with a 3-row items table
 * and a totals dl, then the shipping-address card. Sticking close
 * to the real layout means the user sees the same shape while the
 * (slow) Wompi webhook side effects resolve.
 *
 * role="status" + aria-label announce "Cargando el pedido" once.
 */
export default function OrderDetailLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando el pedido"
    >
      {/* Top nav row */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="space-y-6">
        {/* Products card */}
        <div
          aria-hidden="true"
          className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6"
        >
          <Skeleton className="h-5 w-32" />
          <Separator />
          <ul role="list" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-28" />
          </div>
        </div>

        {/* Shipping address card */}
        <div
          aria-hidden="true"
          className="border-border/60 bg-card/50 space-y-3 rounded-xl border p-6"
        >
          <Skeleton className="h-5 w-44" />
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
