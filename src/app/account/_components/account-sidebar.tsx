'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Package, User, type LucideIcon } from 'lucide-react';

import { cn } from '@/presentation/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If the current pathname starts with this prefix, the link is active. */
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/account', label: 'Perfil', icon: User, matchPrefix: '/account' },
  {
    href: '/account/addresses',
    label: 'Direcciones',
    icon: MapPin,
    matchPrefix: '/account/addresses',
  },
  { href: '/orders', label: 'Mis pedidos', icon: Package },
];

/**
 * Account sidebar (Phase 6).
 *
 * Client component because active state needs `usePathname()`. Renders
 * the same three-link nav as the admin sidebar but lighter — no
 * collapsible mobile panel needed; account pages are simple enough
 * to scroll a single column on small screens.
 */
export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones de tu cuenta" className="lg:sticky lg:top-24">
      <div className="border-border/60 bg-card/50 rounded-xl border p-3">
        <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mi cuenta
        </p>
        <ul role="list" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefix
              ? pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
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
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
