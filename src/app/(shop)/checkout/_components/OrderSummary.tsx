import Image from 'next/image';
import Link from 'next/link';

import { Separator } from '@/presentation/components/ui/separator';
import { formatCOP } from '@/presentation/lib/price-format';
import { cn } from '@/presentation/lib/utils';

export interface OrderSummaryItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  total: number;
  className?: string;
}

/**
 * Presentational order summary used on the checkout page.
 *
 * - One row per cart line: thumbnail, name, qty, line subtotal.
 * - Footer: divider + "Total: $X COP".
 * - No state, no actions — this is a pure render of the parent data.
 */
export function OrderSummary({ items, total, className }: OrderSummaryProps) {
  return (
    <aside
      aria-label="Resumen del pedido"
      className={cn(
        'border-border/60 bg-card/50 rounded-xl border p-4 sm:p-6 lg:sticky lg:top-24',
        className,
      )}
    >
      <h2 className="font-display text-lg font-semibold">Resumen del pedido</h2>
      <p className="mt-1 text-xs text-muted-foreground">Revisá los productos antes de pagar.</p>

      <ul role="list" className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.productId} className="flex items-start gap-3">
            <Link
              href={`/products/${item.slug}`}
              aria-label={`Ver ${item.name}`}
              className="border-border/60 relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="text-[10px]">Sin imagen</span>
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.quantity} × {formatCOP(item.unitPrice)}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatCOP(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <Separator className="my-4" />

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular-nums">{formatCOP(total)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Envío</dt>
          <dd className="text-muted-foreground">Calculado por la transportadora</dd>
        </div>
      </dl>

      <Separator className="my-4" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total</span>
        <span
          className="font-display text-2xl font-bold tabular-nums"
          aria-label={`Total ${formatCOP(total)}`}
        >
          {formatCOP(total)}
        </span>
      </div>
    </aside>
  );
}
