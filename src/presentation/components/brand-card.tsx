import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent } from '@/presentation/components/ui/card';
import { cn } from '@/presentation/lib/utils';
import type { Brand } from '@/domain/entities/Brand';

export interface BrandCardProps {
  brand: Brand;
  /** Number of products in this brand. Optional - shown when provided. */
  productCount?: number;
  className?: string;
}

export function BrandCard({ brand, productCount, className }: BrandCardProps) {
  const href = `/marcas/${brand.slug}`;

  return (
    <Link
      href={href}
      aria-label={`Ver productos de la marca ${brand.name}`}
      className={cn(
        'group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Card className="group-hover:border-primary/40 h-full transition-all group-hover:shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="relative flex h-24 w-full items-center justify-center overflow-hidden">
            <Image
              src={brand.logo}
              alt={brand.name}
              fill
              sizes="(min-width: 1024px) 20vw, 50vw"
              className="object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
            />
          </div>
          <div className="text-center">
            <p className="font-display text-base font-semibold">{brand.name}</p>
            {typeof productCount === 'number' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </p>
            ) : null}
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline">
            Ver productos
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
