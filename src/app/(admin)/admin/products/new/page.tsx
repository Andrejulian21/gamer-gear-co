import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';

import { ProductForm } from '../_components/product-form';

export const metadata = {
  title: 'Nuevo producto — Admin Gamer Gear',
};

/**
 * New product page (Phase 5, B1).
 *
 * Server component. Fetches brands + categories for the form's
 * dropdowns, then renders the form in create mode. If there are no
 * brands or categories, surface a guard rail so the form is not
 * rendered in an un-submittable state.
 */
export default async function NewProductPage() {
  const deps = getAdminDeps();
  const [brands, categories] = await Promise.all([
    deps.brandRepository.findAll(),
    deps.categoryRepository.findAll(),
  ]);

  if (brands.length === 0 || categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        <EmptyState
          title="Faltan datos para crear un producto"
          description={
            brands.length === 0 && categories.length === 0
              ? 'Necesitás al menos una marca y una categoría antes de crear un producto.'
              : brands.length === 0
                ? 'Necesitás al menos una marca antes de crear un producto.'
                : 'Necesitás al menos una categoría antes de crear un producto.'
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {brands.length === 0 ? (
                <Button asChild variant="outline">
                  <Link href="/admin/brands/new">Crear marca</Link>
                </Button>
              ) : null}
              {categories.length === 0 ? (
                <Button asChild variant="outline">
                  <Link href="/admin/categories/new">Crear categoría</Link>
                </Button>
              ) : null}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Header />
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Nuevo producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completá los datos del producto.</p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/products">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </Button>
    </header>
  );
}
