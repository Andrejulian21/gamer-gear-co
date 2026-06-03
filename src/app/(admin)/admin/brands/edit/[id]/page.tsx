import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';

import { BrandForm } from '../../_components/brand-form';

export const metadata = {
  title: 'Editar marca — Admin Gamer Gear',
};

interface EditBrandPageProps {
  params: { id: string };
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const deps = getAdminDeps();
  const brand = await deps.brandRepository.findById(params.id);
  if (!brand) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Editar marca</h1>
          <p className="mt-1 text-sm text-muted-foreground">{brand.name}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/brands">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </header>

      <BrandForm brand={brand} />
    </div>
  );
}
