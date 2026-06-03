import Link from 'next/link';
import { Plus, Tag } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';
import { prisma } from '@/infrastructure/db/prisma';

import { DeleteConfirmButton } from '../_components/delete-confirm-button';
import { deleteBrandAction } from './actions';

export const metadata = {
  title: 'Marcas — Admin Gamer Gear',
};

/**
 * Brand list page (Phase 5, B2).
 *
 * Server component. Lists all brands with their product count
 * (joined via Prisma directly — no use case for "list with count"
 * shipped, and a one-off aggregate doesn't justify a new use case).
 */
export default async function AdminBrandsPage() {
  const deps = getAdminDeps();
  const [brands, counts] = await Promise.all([
    deps.brandRepository.findAll(),
    prisma.product.groupBy({
      by: ['brandId'],
      _count: { _all: true },
    }),
  ]);
  const countByBrandId = new Map(counts.map((c) => [c.brandId, c._count._all]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Marcas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brands.length === 0
              ? 'Sin marcas'
              : `${brands.length} ${brands.length === 1 ? 'marca' : 'marcas'}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/brands/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva marca
          </Link>
        </Button>
      </header>

      {brands.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay marcas"
          description="Creá tu primera marca para empezar."
          action={
            <Button asChild>
              <Link href="/admin/brands/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva marca
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
                  Marca
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
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="h-10 w-10 shrink-0 rounded-md border border-zinc-800 bg-zinc-950 object-contain"
                      />
                      <div>
                        <p className="font-medium text-foreground">{b.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{b.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {countByBrandId.get(b.id) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/brands/edit/${b.id}`}>Editar</Link>
                      </Button>
                      <DeleteConfirmButton
                        label="Eliminar"
                        confirmMessage={`Eliminar la marca "${b.name}"?`}
                        action={async () => {
                          const result = await deleteBrandAction(b.id);
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
