import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Users as UsersIcon } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/empty-state';
import { Button } from '@/presentation/components/ui/button';

import { RolePill } from './_components/role-pill';
import { UsersSearchBar } from './_components/UsersSearchBar';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Usuarios — Admin — Gamer Gear Colombia',
};

interface PageProps {
  searchParams: { page?: string; search?: string };
}

const PAGE_SIZE = 20;

/**
 * Admin users listing — Phase 5 (C1).
 *
 * Server component. Flow:
 *  1. Auth-gate (ADMIN role required).
 *  2. Parse `?page=N&search=...` from the URL and call the admin
 *     use case.
 *  3. Render a card list, one row per user. Each row links to
 *     /admin/users/[id] for the detail/role-edit view.
 *  4. <UsersSearchBar /> is a client form that submits via GET.
 *  5. Pagination controls via search params (the integrator will
 *     swap in the proper <Pagination /> once beta lands it).
 */
export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/login?next=%2Fadmin%2Fusers');
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const search = searchParams.search?.trim() || undefined;

  const { listAllUsers } = getAdminDeps();
  const users = await listAllUsers({ page, pageSize: PAGE_SIZE, search });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="mb-6">
        <UsersSearchBar initialSearch={search ?? ''} />
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" aria-hidden="true" />}
          title="No se encontraron usuarios"
          description={
            search
              ? `Ningún usuario coincide con "${search}".`
              : 'Aún no se han registrado usuarios.'
          }
          action={
            search ? (
              <Button asChild variant="outline">
                <Link href="/admin/users">Ver todos los usuarios</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul role="list" className="space-y-3">
            {users.map((user) => (
              <li key={user.id}>
                <Card className="transition-colors hover:border-border">
                  <CardContent className="p-0">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-semibold">{user.name}</p>
                          <RolePill role={user.role} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{user.email}</span> · Registrado el{' '}
                          {formatUserDate(user.createdAt)}
                        </p>
                      </div>

                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <PaginationControls
            page={page}
            pageSize={PAGE_SIZE}
            rowCount={users.length}
            search={search}
          />
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las cuentas de usuario y sus roles.
        </p>
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  pageSize,
  rowCount,
  search,
}: {
  page: number;
  pageSize: number;
  rowCount: number;
  search: string | undefined;
}) {
  const hasNext = rowCount === pageSize;
  const hasPrev = page > 1;
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (search) params.set('search', search);
    return `/admin/users?${params.toString()}`;
  };
  return (
    <nav
      aria-label="Paginación de usuarios"
      className="mt-6 flex items-center justify-between gap-2"
    >
      <p className="text-xs text-muted-foreground">
        Página {page} · {rowCount} {rowCount === 1 ? 'usuario' : 'usuarios'}
      </p>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page - 1)}>Anterior</Link>
          </Button>
        ) : null}
        {hasNext ? (
          <Button asChild variant="outline" size="sm">
            <Link href={buildHref(page + 1)}>Siguiente</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}

function formatUserDate(date: Date | undefined): string {
  if (!date) return 'fecha desconocida';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
