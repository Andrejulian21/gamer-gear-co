import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaCategoryRepository } from '@/infrastructure/repositories/PrismaCategoryRepository';
import { listProducts } from '@/domain/use-cases/products/ListProducts';
import { ProductCard } from '@/presentation/components/product-card';
import { FilterSidebar } from '@/presentation/components/filter-sidebar';
import { EmptyState } from '@/presentation/components/empty-state';
import { Button } from '@/presentation/components/ui/button';
import { SearchX } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Productos — Gamer Gear Colombia',
  description:
    'Explora nuestro catálogo completo de periféricos gamer: mouse, teclados mecánicos, audífonos y mousepads de Razer, Logitech G, Corsair, HyperX y Redragon.',
};

interface SearchParams {
  brand?: string | string[];
  category?: string | string[];
  q?: string;
}

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const brandRepo = new PrismaBrandRepository();
  const categoryRepo = new PrismaCategoryRepository();
  const productRepo = new PrismaProductRepository();

  const [allBrands, allCategories] = await Promise.all([
    brandRepo.findAll(),
    categoryRepo.findAll(),
  ]);

  const selectedBrandSlugs = toArray(searchParams.brand);
  const selectedCategorySlugs = toArray(searchParams.category);
  const search = searchParams.q?.trim() || undefined;

  const selectedBrands = allBrands.filter((b) => selectedBrandSlugs.includes(b.slug));
  const selectedCategories = allCategories.filter((c) => selectedCategorySlugs.includes(c.slug));

  const useBrandId = selectedBrands.length === 1 ? selectedBrands[0].id : undefined;
  const useCategoryId = selectedCategories.length === 1 ? selectedCategories[0].id : undefined;

  const products = await listProducts(
    {
      ...(useBrandId ? { brandId: useBrandId } : {}),
      ...(useCategoryId ? { categoryId: useCategoryId } : {}),
      ...(search ? { search } : {}),
      limit: 60,
    },
    { productRepository: productRepo },
  );

  const brandById = new Map(allBrands.map((b) => [b.id, b]));

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <FilterSidebar
        brands={allBrands}
        categories={allCategories}
        className="lg:sticky lg:top-24 lg:self-start"
      />

      <section aria-label="Lista de productos">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length === 0
              ? 'Sin resultados'
              : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}
            {search ? (
              <>
                {' '}
                para <span className="font-medium text-foreground">&ldquo;{search}&rdquo;</span>
              </>
            ) : null}
          </p>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title="No encontramos productos"
            description="Probá quitar algunos filtros o usar otros términos de búsqueda."
            action={
              <Button asChild variant="outline">
                <Link href="/products">Limpiar filtros</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} brandName={brandById.get(product.brandId)?.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filtrá por marca, categoría o buscá por nombre.
        </p>
      </header>

      <Suspense fallback={null}>
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
