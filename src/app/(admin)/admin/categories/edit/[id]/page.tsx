import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';

import { CategoryForm } from '../../_components/category-form';

export const metadata = {
  title: 'Editar categoría — Admin Gamer Gear',
};

interface EditCategoryPageProps {
  params: { id: string };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const deps = getAdminDeps();
  const category = await deps.categoryRepository.findById(params.id);
  if (!category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Editar categoría</h1>
          <p className="mt-1 text-sm text-muted-foreground">{category.name}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </header>

      <CategoryForm category={category} />
    </div>
  );
}
