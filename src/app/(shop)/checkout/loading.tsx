import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Checkout loading skeleton (Phase 7).
 *
 * Mirrors the (real) checkout layout: header on top, two-column
 * body — form fields on the left, sticky order summary on the right.
 * The form is long (contact, shipping, payment), so we render a
 * faithful set of input placeholders to avoid layout shift when the
 * real form hydrates.
 *
 * role="status" + aria-label announce "Cargando el checkout" once.
 */
export default function CheckoutLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando el checkout"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="hidden h-8 w-32 sm:block" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Form column */}
        <div aria-hidden="true" className="space-y-6">
          {/* Section 1: contact */}
          <div className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6">
            <Skeleton className="h-5 w-40" />
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Section 2: shipping */}
          <div className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6">
            <Skeleton className="h-5 w-48" />
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Skeleton className="h-12 w-full" />
        </div>

        {/* Order summary column */}
        <aside aria-hidden="true" className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-border/60 bg-card/50 space-y-4 rounded-xl border p-6">
            <Skeleton className="h-5 w-40" />
            <Separator />
            <ul role="list" className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </li>
              ))}
            </ul>
            <Separator />
            <div className="space-y-2">
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
          </div>
        </aside>
      </div>
    </div>
  );
}
