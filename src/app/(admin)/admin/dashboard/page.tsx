import { Users, Package, ShoppingBag, Banknote, type LucideIcon } from 'lucide-react';

import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { formatCOP } from '@/presentation/lib/price-format';

import { StatCard } from '../_components/stat-card';
import { LowStockList } from '../_components/low-stock-list';
import { RecentOrdersList } from '../_components/recent-orders-list';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/components/ui/card';

export const metadata = {
  title: 'Dashboard — Admin Gamer Gear',
  description: 'Resumen general de la tienda.',
};

/**
 * Admin dashboard (Phase 5, B1).
 *
 * Server component. Flow:
 *  1. Read the dashboard stats (alpha-shipped use case).
 *  2. Hydrate brand + user lookups for the low-stock and recent-orders
 *     lists. These two lists show derived data, so we fetch the lookup
 *     maps once and pass them down as Map<string, string>.
 *  3. Render four stat cards (revenue, orders, products, users) and
 *     the two list panels.
 */
export default async function AdminDashboardPage() {
  const deps = getAdminDeps();
  const stats = await deps.getDashboardStats();

  // Total of all orders (sum across statuses, not just PAID).
  const totalOrders = Object.values(stats.ordersByStatus).reduce((acc, n) => acc + n, 0);

  // Hydrate brand names for the low-stock list.
  const brands = await deps.brandRepository.findAll();
  const brandById = new Map(brands.map((b) => [b.id, b.name]));

  // Hydrate user emails for the recent-orders list. We only need a
  // small handful (RECENT_ORDERS_LIMIT = 10), so we look up by id
  // instead of fetching the entire users table.
  const userIds = Array.from(new Set(stats.recentOrders.map((o) => o.userId)));
  const userEmailById = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const user = await deps.userRepository.findById(id);
      if (user) userEmailById.set(id, user.email);
    }),
  );

  const cards: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
  }> = [
    { title: 'Ingresos pagados', value: formatCOP(stats.totalRevenue), icon: Banknote },
    { title: 'Pedidos totales', value: totalOrders, icon: ShoppingBag },
    { title: 'Productos', value: stats.totalProducts, icon: Package },
    { title: 'Usuarios', value: stats.totalUsers, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen general del estado de la tienda.
        </p>
      </header>

      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((c) => (
          <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base">Bajo stock</CardTitle>
            <p className="text-xs text-muted-foreground">
              Productos con menos de 5 unidades. Reabastecé pronto.
            </p>
          </CardHeader>
          <CardContent>
            <LowStockList products={stats.lowStockProducts} brandById={brandById} />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base">Pedidos recientes</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 10 pedidos, más nuevos primero.</p>
          </CardHeader>
          <CardContent>
            <RecentOrdersList orders={stats.recentOrders} userEmailById={userEmailById} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
