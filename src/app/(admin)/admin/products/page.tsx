import Link from 'next/link';
import { Plus, Package } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';
import { cn } from '@/presentation/lib/utils';

import { Pagination } from '../_components/pagination';
import { DeleteConfirmButton } from '../_components/delete-confirm-button';
import { deleteProductAction } from './actions';

export const metadata = {
  title: 'Productos — Admin Gamer Gear',
  description: 'Lista y gestión de productos.',
};

const PAGE_SIZE = 20;

interface SearchParams {
  page?: string;
}

interface ProductsPageProps {
  searchParams: SearchParams;
}

function parsePageParam(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * Product list page (Phase 5, B1).
 *
 * Server component. Reads `?page=N` from the URL, queries products
 * with pagination, and renders a table with row-level actions.
 */
export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const deps = getAdminDeps();
  const page = parsePageParam(searchParams.page);

  const [products, total] = await Promise.all([
    deps.productRepository.findMany({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    deps.productRepository.count({}),
  ]);

  // Hydrate brand + category names. Maps are cheap to build and let
  // the row render do a single Map.get per id.
  const [brands, categories] = await Promise.all([
    deps.brandRepository.findAll(),
    deps.categoryRepository.findAll(),
  ]);
  const brandNameById = new Map(brands.map((b) => [b.id, b.name]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total === 0
              ? 'Sin productos'
              : `${total} ${total === 1 ? 'producto' : 'productos'} en total`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo producto
          </Link>
        </Button>
      </header>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay productos"
          description="Creá tu primer producto para empezar."
          action={
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nuevo producto
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="border-border/60 overflow-x-auto rounded-xl border bg-zinc-900/40">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Producto
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                  Marca
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Precio
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Stock
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Destacado
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/edit/${p.id}`}
                      className="font-medium text-foreground hover:text-lime-400"
                    >
                      {p.name}
                    </Link>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {brandNameById.get(p.brandId) ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {categoryNameById.get(p.categoryId) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCOP(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span
                      className={cn(
                        'inline-block min-w-[2ch] rounded-md border px-2 py-0.5 text-center font-mono text-xs font-semibold',
                        p.stock === 0
                          ? 'border-red-500/40 bg-red-500/10 text-red-300'
                          : p.stock < 5
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                            : 'border-zinc-700 bg-zinc-900 text-foreground',
                      )}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {p.featured ? 'Si' : 'No'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/products/edit/${p.id}`}>Editar</Link>
                      </Button>
                      <DeleteConfirmButton
                        label="Eliminar"
                        confirmMessage={`Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`}
                        action={async () => {
                          const result = await deleteProductAction(p.id);
                          if (!result.ok) {
                            throw new Error(result.error);
                          }
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

      <Pagination page={page} totalPages={totalPages} basePath="/admin/products" />
    </div>
  );
}
