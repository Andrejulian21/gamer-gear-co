import { GridSkeleton, ProductCardSkeleton } from '@/presentation/components/loading-skeleton';

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-md bg-muted" />
      <GridSkeleton count={8} Item={ProductCardSkeleton} />
    </div>
  );
}
