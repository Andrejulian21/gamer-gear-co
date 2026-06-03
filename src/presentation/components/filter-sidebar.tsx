'use client';

import * as React from 'react';
import { useCallback, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Label } from '@/presentation/components/ui/label';
import { Separator } from '@/presentation/components/ui/separator';
import type { Brand } from '@/domain/entities/Brand';
import type { Category } from '@/domain/entities/Category';

export interface FilterSidebarProps {
  brands: Brand[];
  categories: Category[];
  /** ClassName for the outer aside element. */
  className?: string;
}

/**
 * Read the current filter values from the URL so the component is
 * fully controlled by `searchParams` and survives reloads.
 */
function readSelected(searchParams: URLSearchParams, key: string): Set<string> {
  const raw = searchParams.getAll(key);
  return new Set(raw);
}

function toggleParam(
  searchParams: URLSearchParams,
  key: string,
  value: string,
  checked: boolean,
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  const current = new Set(next.getAll(key));

  if (checked) {
    current.add(value);
  } else {
    current.delete(value);
  }

  next.delete(key);
  current.forEach((v) => {
    next.append(key, v);
  });

  // Reset to first page whenever filters change.
  next.delete('page');

  return next;
}

export function FilterSidebar({ brands, categories, className }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedBrands = useMemo(() => readSelected(searchParams, 'brand'), [searchParams]);
  const selectedCategories = useMemo(() => readSelected(searchParams, 'category'), [searchParams]);

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const onToggleBrand = useCallback(
    (slug: string, checked: boolean) => {
      navigate(toggleParam(searchParams, 'brand', slug, checked));
    },
    [navigate, searchParams],
  );

  const onToggleCategory = useCallback(
    (slug: string, checked: boolean) => {
      navigate(toggleParam(searchParams, 'category', slug, checked));
    },
    [navigate, searchParams],
  );

  const onClear = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const hasActiveFilters = selectedBrands.size > 0 || selectedCategories.size > 0;

  return (
    <aside
      className={className}
      aria-label="Filtros de productos"
      data-pending={isPending ? 'true' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filtros
        </h2>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isPending}
            aria-label="Limpiar todos los filtros"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar
          </Button>
        ) : null}
      </div>

      <Separator className="my-4" />

      <section aria-labelledby="filter-categories" className="space-y-3">
        <h3
          id="filter-categories"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Categorias
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay categorias disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => {
              const id = `cat-${category.id}`;
              const checked = selectedCategories.has(category.slug);
              return (
                <li key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => onToggleCategory(category.slug, value === true)}
                    disabled={isPending}
                  />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {category.name}
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Separator className="my-4" />

      <section aria-labelledby="filter-brands" className="space-y-3">
        <h3
          id="filter-brands"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Marcas
        </h3>
        {brands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay marcas disponibles.</p>
        ) : (
          <ul className="space-y-2">
            {brands.map((brand) => {
              const id = `brand-${brand.id}`;
              const checked = selectedBrands.has(brand.slug);
              return (
                <li key={brand.id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => onToggleBrand(brand.slug, value === true)}
                    disabled={isPending}
                  />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {brand.name}
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
