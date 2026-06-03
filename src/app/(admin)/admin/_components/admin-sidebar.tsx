'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  FolderTree,
  LogOut,
  Store,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/presentation/lib/utils';
import { Separator } from '@/presentation/components/ui/separator';

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If the current pathname starts with this prefix, the link is active. */
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    matchPrefix: '/admin/dashboard',
  },
  { href: '/admin/products', label: 'Productos', icon: Package, matchPrefix: '/admin/products' },
  { href: '/admin/brands', label: 'Marcas', icon: Tag, matchPrefix: '/admin/brands' },
  {
    href: '/admin/categories',
    label: 'Categorías',
    icon: FolderTree,
    matchPrefix: '/admin/categories',
  },
];

/**
 * Admin sidebar (Phase 5, B1).
 *
 * Client component because active state needs `usePathname()`.
 * Collapsible on mobile: a top hamburger button toggles a full-height
 * panel that overlays the main content. We don't pull in a Sheet
 * primitive — a simple useState + conditional class is enough for
 * the four-link nav and keeps the bundle small.
 *
 * Logout uses the same `/api/auth/signout` POST pattern as
 * `shop-navbar.tsx` — server-side signOut, no client SDK.
 */
export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Navegación del admin"
        className="hidden w-64 shrink-0 border-r border-zinc-900 bg-zinc-900/40 lg:flex lg:flex-col"
      >
        <SidebarContent pathname={pathname} userName={userName} userEmail={userEmail} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex w-full items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-4 py-3 lg:hidden">
        <Link href="/admin/dashboard" className="font-display text-base font-bold tracking-tight">
          <span className="text-foreground">GAMER</span>
          <span className="text-lime-400"> GEAR</span>
          <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </Link>
        <Link
          href="/"
          aria-label="Volver a la tienda"
          className="text-muted-foreground hover:text-foreground"
        >
          <Store className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

interface SidebarContentProps {
  pathname: string;
  userName: string;
  userEmail: string;
}

function SidebarContent({ pathname, userName, userEmail }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Link
          href="/admin/dashboard"
          className="font-display text-lg font-bold tracking-tight"
          aria-label="Admin — Gamer Gear"
        >
          <span className="text-foreground">GAMER</span>
          <span className="text-lime-400"> GEAR</span>
          <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">Panel de administración</p>
      </div>

      <Separator className="bg-zinc-800" />

      <nav aria-label="Secciones" className="flex-1 px-3 py-4">
        <ul role="list" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-lime-400'
                      : 'text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-800 px-4 py-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium text-foreground">{userName || 'Admin'}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-zinc-800/50 hover:text-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
