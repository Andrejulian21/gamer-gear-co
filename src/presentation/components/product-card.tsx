import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';

import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/presentation/components/ui/card';
import { cn } from '@/presentation/lib/utils';
import { formatCOP } from '@/presentation/lib/price-format';
import type { Product } from '@/domain/entities/Product';

export interface ProductCardProps {
  product: Product;
  /** Optional brand name to display as a badge. */
  brandName?: string;
  className?: string;
  /**
   * Whether to mark the image as priority (LCP candidate).
   * Use for above-the-fold cards only.
   */
  priority?: boolean;
}

function StockIndicator({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" aria-label="Sin stock">
        Agotado
      </Badge>
    );
  }
  if (stock < 5) {
    return (
      <Badge variant="secondary" aria-label={`Quedan ${stock} unidades`}>
        Ultimas {stock} unidades
      </Badge>
    );
  }
  return (
    <Badge variant="outline" aria-label="Disponible">
      Disponible
    </Badge>
  );
}

export function ProductCard({ product, brandName, className, priority = false }: ProductCardProps) {
  const cover = product.images[0];
  const href = `/products/${product.slug}`;

  return (
    <Card
      className={cn(
        'border-border/60 hover:border-primary/40 group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg',
        className,
      )}
    >
      <Link
        href={href}
        className="flex h-full flex-col"
        aria-label={`Ver detalle de ${product.name}`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-muted-foreground"
              aria-hidden="true"
            >
              <Package className="h-12 w-12" />
            </div>
          )}
          {product.featured ? (
            <Badge
              variant="default"
              className="absolute left-3 top-3"
              aria-label="Producto destacado"
            >
              Destacado
            </Badge>
          ) : null}
        </div>

        <CardHeader className="space-y-1.5 pb-2">
          {brandName ? (
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{brandName}</p>
          ) : null}
          <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
            {product.name}
          </h3>
        </CardHeader>

        <CardContent className="flex-1 pb-2">
          <p
            className="font-display text-xl font-bold text-foreground"
            aria-label={`Precio ${formatCOP(product.price)}`}
          >
            {formatCOP(product.price)}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 pt-2">
          <StockIndicator stock={product.stock} />
          <span className="text-sm font-medium text-primary group-hover:underline">
            Ver detalle
          </span>
        </CardFooter>
      </Link>
    </Card>
  );
}
