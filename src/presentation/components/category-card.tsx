import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/presentation/components/ui/card';
import { cn } from '@/presentation/lib/utils';
import type { Category } from '@/domain/entities/Category';

export interface CategoryCardProps {
  category: Category;
  /** Number of products in this category. Optional. */
  productCount?: number;
  className?: string;
}

export function CategoryCard({ category, productCount, className }: CategoryCardProps) {
  const href = `/categories/${category.slug}`;

  return (
    <Link
      href={href}
      aria-label={`Ver productos de la categoria ${category.name}`}
      className={cn(
        'group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Card className="group-hover:border-primary/40 group-hover:bg-accent/40 h-full transition-all">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-base font-semibold">{category.name}</p>
            {typeof productCount === 'number' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </p>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
            Ver productos
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
