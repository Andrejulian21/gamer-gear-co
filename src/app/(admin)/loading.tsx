import { Skeleton } from '@/presentation/components/loading-skeleton';
import { Separator } from '@/presentation/components/ui/separator';

/**
 * Admin section loading skeleton (Phase 7).
 *
 * Mirrors the admin dashboard: 4 stat-card skeletons on top, then
 * two panels (low-stock + recent-orders). Renders inside the
 * (admin) layout which already provides the AdminSidebar, so this
 * sits in the main column. Other admin routes (brands, products,
 * orders) also inherit this same loading UI while their data
 * resolves.
 *
 * The zinc-900/40 + zinc-800 palette matches the admin shell so the
 * skeleton doesn't flash bright on a dark page.
 *
 * role="status" + aria-label announce "Cargando el panel de
 * administracion" once.
 */
export default function AdminLoading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Cargando el panel de administracion"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Panels */}
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low stock panel */}
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Separator />
          <ul role="list" className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-12" />
              </li>
            ))}
          </ul>
        </div>

        {/* Recent orders panel */}
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Separator />
          <ul role="list" className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
