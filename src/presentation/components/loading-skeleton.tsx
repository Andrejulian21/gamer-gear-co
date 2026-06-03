import { cn } from '@/presentation/lib/utils';

/**
 * Reusable animated skeleton block. Wrap content to reserve space
 * while data loads and prevent layout shift.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div
      className="border-border/60 flex h-full flex-col overflow-hidden rounded-xl border"
      aria-label="Cargando producto"
      role="status"
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-6 pb-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="flex items-center justify-between gap-2 p-6 pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function BrandCardSkeleton() {
  return (
    <div
      className="border-border/60 rounded-xl border p-6"
      aria-label="Cargando marca"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div
      className="border-border/60 rounded-xl border p-5"
      aria-label="Cargando categoria"
      role="status"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function GridSkeleton({
  count = 8,
  Item,
  className,
}: {
  count?: number;
  Item: () => React.ReactElement;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
      role="status"
      aria-label="Cargando contenido"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Item key={index} />
      ))}
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, BrandCardSkeleton, CategoryCardSkeleton, GridSkeleton };
