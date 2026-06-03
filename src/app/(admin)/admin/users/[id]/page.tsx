import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, MapPin, Receipt } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Separator } from '@/presentation/components/ui/separator';
import { UserNotFoundError } from '@/domain/errors/AdminErrors';
import { OrderStatusBadge } from '@/app/(shop)/orders/_components/OrderStatusBadge';

import { RolePill } from '../_components/role-pill';
import { RoleUpdateForm } from './_components/RoleUpdateForm';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Usuario ${params.id.slice(0, 8)} — Admin — Gamer Gear Colombia`,
  };
}

/**
 * Admin user detail — Phase 5 (C1).
 *
 * Server component. Flow:
 *  1. Auth-gate (ADMIN role).
 *  2. Resolve the user detail (user + orders + addresses).
 *  3. Render the header (name, email, role, createdAt), the
 *     order history, the addresses, and the role-update form.
 *
 * The role-update form is hidden for the currently logged-in
 * admin: the `UpdateUserRole` use case refuses self-demotion
 * (CannotDemoteSelfError), so we hide the UI to keep the form
 * clean and avoid an error toast.
 */
export default async function AdminUserDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect(`/login?next=%2Fadmin%2Fusers%2F${params.id}`);
  }

  const { getUserDetail } = getAdminDeps();
  let detail;
  try {
    detail = await getUserDetail({ userId: params.id });
  } catch (err) {
    if (err instanceof UserNotFoundError) notFound();
    throw err;
  }

  const { user, orders, addresses } = detail;
  const isSelf = user.id === session.user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver a usuarios
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          ID: <span className="font-mono">{user.id}</span>
        </p>
      </div>

      <header className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">{user.name}</h1>
          <RolePill role={user.role} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{user.email}</span> · Registrado el{' '}
          {formatUserDate(user.createdAt)}
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rol del usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {isSelf ? (
              <p className="text-sm text-muted-foreground">
                No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.
              </p>
            ) : (
              <RoleUpdateForm targetUserId={user.id} currentRole={user.role} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Pedidos ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este usuario aún no tiene pedidos.</p>
            ) : (
              <ul role="list" className="space-y-2">
                {orders.slice(0, 10).map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="border-border/60 flex items-center justify-between rounded-md border p-3 transition-colors hover:border-border"
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatOrderDate(order.createdAt)} · {order.items.length}{' '}
                          {order.items.length === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={order.status} />
                        <span className="font-display font-semibold tabular-nums">
                          {formatCOP(order.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {orders.length > 10 ? (
              <>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Mostrando los 10 pedidos más recientes de {orders.length} en total.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Direcciones ({addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este usuario no tiene direcciones guardadas.
              </p>
            ) : (
              <ul role="list" className="space-y-3">
                {addresses.map((address) => (
                  <li key={address.id} className="border-border/60 rounded-md border p-3">
                    <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                      <p className="font-medium text-foreground">{address.street}</p>
                      <p>
                        {address.city}, {address.state}
                      </p>
                      <p>C.P. {address.zipCode}</p>
                      <p className="mt-1">Tel: {address.phone}</p>
                      {address.isDefault ? (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Dirección predeterminada
                        </p>
                      ) : null}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatOrderDate(date: Date | undefined): string {
  if (!date) return 'Fecha desconocida';
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

function formatUserDate(date: Date | undefined): string {
  if (!date) return 'fecha desconocida';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
