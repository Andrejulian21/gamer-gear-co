import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';

import { ProductForm } from '../../_components/product-form';

export const metadata = {
  title: 'Editar producto — Admin Gamer Gear',
};

interface EditProductPageProps {
  params: { id: string };
}

/**
 * Edit product page (Phase 5, B1).
 *
 * Server component. Loads the product, brands, and categories, and
 * hands them to the form in edit mode. 404s on unknown id.
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const deps = getAdminDeps();
  const [product, brands, categories] = await Promise.all([
    deps.productRepository.findById(params.id),
    deps.brandRepository.findAll(),
    deps.categoryRepository.findAll(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Editar producto</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {product.name}
            <span className="text-muted-foreground/70 ml-2 font-mono text-[10px]">
              {product.id}
            </span>
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/products">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </header>

      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
