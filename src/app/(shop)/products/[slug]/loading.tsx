import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Product detail loading skeleton (Phase 7).
 *
 * Two-column layout mirroring the (real) /products/[slug] page:
 *   - left: square image skeleton
 *   - right: brand/category breadcrumbs, name, price, stock badge,
 *     description lines, an "add to cart" CTA, and a trust strip
 *     (3 icons + labels) at the bottom.
 *
 * role="status" + aria-label announce "Cargando el producto" once.
 */
export default function ProductDetailLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando el producto"
    >
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div aria-hidden="true">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-md" />
            ))}
          </div>
        </div>

        {/* Info column */}
        <div aria-hidden="true" className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>

          {/* Add to cart */}
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-56" />
          </div>

          {/* Trust strip */}
          <div className="border-border/60 grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
