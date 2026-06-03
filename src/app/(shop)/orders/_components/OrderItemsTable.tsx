import Image from 'next/image';
import Link from 'next/link';

import { formatCOP } from '@/presentation/lib/price-format';

export interface OrderItemsTableItem {
  productId: string;
  product: {
    name: string;
    image: string;
    slug: string;
  };
  quantity: number;
  price: number;
}

interface OrderItemsTableProps {
  items: OrderItemsTableItem[];
}

/**
 * Items line of the order detail page.
 *
 * Pure presentational. Renders one row per item with thumbnail, name,
 * qty, unit price and line subtotal. Wraps to a stacked layout on
 * mobile so the columns don't squish.
 */
export function OrderItemsTable({ items }: OrderItemsTableProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Este pedido no tiene productos.</p>;
  }

  return (
    <div className="border-border/60 overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <caption className="sr-only">Productos del pedido</caption>
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium">
              Producto
            </th>
            <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Precio
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Cant.
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody className="divide-border/60 divide-y">
          {items.map((item) => {
            const subtotal = item.price * item.quantity;
            return (
              <tr key={item.productId}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/products/${item.product.slug}`}
                      aria-label={`Ver ${item.product.name}`}
                      className="border-border/60 relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted"
                    >
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <span className="text-[10px]">N/A</span>
                        </div>
                      )}
                    </Link>
                    <span className="line-clamp-2 font-medium">{item.product.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {formatCOP(item.price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatCOP(subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
