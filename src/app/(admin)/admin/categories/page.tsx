import Link from 'next/link';
import { Plus, FolderTree } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';
import { prisma } from '@/infrastructure/db/prisma';

import { DeleteConfirmButton } from '../_components/delete-confirm-button';
import { deleteCategoryAction } from './actions';

export const metadata = {
  title: 'Categorías — Admin Gamer Gear',
};

/**
 * Category list page (Phase 5, B2).
 *
 * Server component. Lists all categories with their product count.
 */
export default async function AdminCategoriesPage() {
  const deps = getAdminDeps();
  const [categories, counts] = await Promise.all([
    deps.categoryRepository.findAll(),
    prisma.product.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
    }),
  ]);
  const countByCategoryId = new Map(counts.map((c) => [c.categoryId, c._count._all]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length === 0
              ? 'Sin categorías'
              : `${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva categoría
          </Link>
        </Button>
      </header>

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay categorías"
          description="Creá tu primera categoría para empezar."
          action={
            <Button asChild>
              <Link href="/admin/categories/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva categoría
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-xl border bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Productos
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {countByCategoryId.get(c.id) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/categories/edit/${c.id}`}>Editar</Link>
                      </Button>
                      <DeleteConfirmButton
                        label="Eliminar"
                        confirmMessage={`Eliminar la categoría "${c.name}"?`}
                        action={async () => {
                          const result = await deleteCategoryAction(c.id);
                          if (!result.ok) throw new Error(result.error);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
