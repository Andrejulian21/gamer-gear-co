import { ShoppingBag } from 'lucide-react';

import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Cart loading skeleton (Phase 7).
 *
 * Mirrors the structure of /cart: a header, a list of 3 cart item
 * rows on the left, and a sticky summary panel on the right. Uses
 * the existing `Skeleton` primitive + raw divs to keep it lean — a
 * full `CartItemRowSkeleton` would import the icons we don't need
 * for a placeholder.
 *
 * role="status" + aria-label so screen readers announce "Cargando
 * tu carrito" once on mount (Next/React already updates live regions
 * for us; this is the polite, non-intrusive default).
 */
export default function CartLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando tu carrito"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="hidden h-8 w-32 sm:block" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items list */}
        <section aria-hidden="true">
          <div className="border-border/60 bg-card/50 rounded-xl border p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Separator />
            <ul role="list" className="divide-border/60 divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Summary panel */}
        <aside aria-hidden="true" className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6">
            <Skeleton className="h-5 w-32" />
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Separator />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
