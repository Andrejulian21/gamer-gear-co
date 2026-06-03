import Link from 'next/link';
import { AlertTriangle, Package } from 'lucide-react';

import type { Product } from '@/domain/entities/Product';
import { formatCOP } from '@/presentation/lib/price-format';
import { cn } from '@/presentation/lib/utils';
import { EmptyState } from '@/presentation/components/empty-state';

export interface LowStockListProps {
  products: Product[];
  /**
   * Optional map of brand id -> name so we can label each row.
   * The dashboard pre-fetches this once and passes it down.
   */
  brandById?: Map<string, string>;
}

const STOCK_LOW = 5;

/**
 * Low-stock tile of the admin dashboard.
 *
 * Renders a compact list of products whose stock is below the
 * LOW_STOCK_THRESHOLD (5). Each row links to the product's edit
 * page. Stock value is red at 0, amber at 1..4, default at 5+.
 *
 * If a product is below threshold but >= 5 we still render it
 * (the dashboard's "low stock" use case is the source of truth for
 * which products to display).
 */
export function LowStockList({ products, brandById }: LowStockListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" aria-hidden="true" />}
        title="Sin productos con bajo stock"
        description="Todos los productos tienen stock suficiente."
      />
    );
  }

  return (
    <ul role="list" className="divide-y divide-zinc-800">
      {products.map((product) => {
        const brandName = brandById?.get(product.brandId);
        const stockClass = stockColorClass(product.stock);
        return (
          <li key={product.id}>
            <Link
              href={`/admin/products/edit/${product.id}`}
              className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-zinc-900/30"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/50 text-amber-400"
                  aria-hidden="true"
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  {brandName ? (
                    <p className="truncate text-xs text-muted-foreground">{brandName}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <span className="text-xs text-muted-foreground">Stock</span>
                <span
                  className={cn(
                    'min-w-[2ch] rounded-md border px-2 py-0.5 text-right font-mono text-sm font-semibold tabular-nums',
                    stockClass,
                  )}
                  aria-label={`${product.stock} unidades en stock`}
                >
                  {product.stock}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {formatCOP(product.price)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function stockColorClass(stock: number): string {
  if (stock <= 0) return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (stock < STOCK_LOW) return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return 'border-zinc-700 bg-zinc-900 text-foreground';
}
