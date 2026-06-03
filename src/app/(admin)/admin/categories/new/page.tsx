import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';

import { CategoryForm } from '../_components/category-form';

export const metadata = {
  title: 'Nueva categoría — Admin Gamer Gear',
};

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Nueva categoría</h1>
          <p className="mt-1 text-sm text-muted-foreground">Completá los datos de la categoría.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </header>

      <CategoryForm />
    </div>
  );
}
