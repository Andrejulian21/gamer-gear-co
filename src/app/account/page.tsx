import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Lock, MapPin, Package, User } from 'lucide-react';

import { auth } from '@/infrastructure/auth/auth';
import { getAccountDeps } from '@/presentation/lib/account-deps';
import { getOrderDeps } from '@/presentation/lib/order-deps';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/empty-state';

import { ProfileForm } from './_components/profile-form';
import { PasswordForm } from './_components/password-form';

export const metadata = {
  title: 'Mi cuenta — Gamer Gear Colombia',
};

/**
 * Account dashboard (Phase 6).
 *
 * Server component. Fetches the user record (to populate the
 * profile form with the latest name/email — the session JWT may
 * be slightly stale), and the most recent 5 orders. Renders the
 * profile + password forms inside cards and the orders as a
 * compact list with a "Ver todos" link to /orders.
 */
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?next=%2Faccount');
  }

  const { userRepository } = getAccountDeps();
  const user = await userRepository.findById(session.user.id);
  // session.user is the source of truth if the user record vanished
  // (edge case — we don't want a server crash to break /account).
  const displayName = user?.name ?? session.user.name ?? '';
  const displayEmail = user?.email ?? session.user.email ?? '';

  const { listUserOrders } = getOrderDeps();
  const allOrders = await listUserOrders({ userId: session.user.id });
  const recentOrders = allOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu información personal, contraseña y pedidos.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultName={displayName} defaultEmail={displayEmail} />
            <div className="border-border/60 mt-4 border-t pt-4">
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/account/addresses">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Administrar direcciones
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Pedidos recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="Aún no has realizado pedidos"
              description="Cuando completes una compra, aparecerá aquí."
              action={
                <Button asChild size="sm">
                  <Link href="/products">Ir a la tienda</Link>
                </Button>
              }
            />
          ) : (
            <ul role="list" className="divide-border/60 divide-y">
              {recentOrders.map((order) => {
                const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition-colors hover:text-primary"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.id.slice(0, 8)}
                      </span>
                      <span className="text-muted-foreground">
                        {itemCount} {itemCount === 1 ? 'producto' : 'productos'} ·{' '}
                        {formatCOP(order.total)}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {order.status}
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {recentOrders.length > 0 ? (
            <div className="mt-3 flex justify-end">
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/orders">
                  Ver todos los pedidos
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
