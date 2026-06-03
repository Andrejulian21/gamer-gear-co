import Link from 'next/link';
import { Suspense } from 'react';
import { LogIn, LogOut, Package, Search, ShoppingCart, User } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Separator } from '@/presentation/components/ui/separator';
import { NavbarCartCount } from '@/presentation/components/navbar-cart-count';
import { cn } from '@/presentation/lib/utils';

type MinimalSession = {
  user?: {
    name?: string | null;
    role?: string | null;
  };
} | null;

export interface ShopNavbarProps {
  session?: MinimalSession;
  className?: string;
}

const NAV_LINKS = [
  { href: '/products', label: 'Productos' },
  { href: '/brands', label: 'Marcas' },
] as const;

export function ShopNavbar({ session, className }: ShopNavbarProps) {
  const isAuthed = Boolean(session?.user);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <header
      className={cn(
        'border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Gamer Gear Colombia - Inicio"
          className="font-display text-lg font-bold tracking-tight"
        >
          <span className="text-foreground">GAMER</span>
          <span className="text-primary"> GEAR</span>
          <span className="ml-1 hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            CO
          </span>
        </Link>

        <nav aria-label="Navegacion principal" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAuthed ? (
              <li>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mis pedidos
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <form
          role="search"
          aria-label="Buscar productos"
          className="ml-auto hidden max-w-sm flex-1 md:flex"
          action="/products"
        >
          <label htmlFor="navbar-search" className="sr-only">
            Buscar productos
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="navbar-search"
              type="search"
              name="q"
              placeholder="Buscar productos, marcas, categorias..."
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {isAuthed ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Mis pedidos"
              className="md:hidden"
            >
              <Link href="/orders">
                <Package className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Ver carrito de compras"
            className="relative"
          >
            <Link href="/cart" data-testid="cart-link">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <Suspense fallback={null}>
                <NavbarCartCount />
              </Suspense>
            </Link>
          </Button>

          {isAuthed ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Mi cuenta">
                <Link href="/account">
                  <User className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              {isAdmin ? (
                <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <form action="/api/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesion">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Iniciar sesion
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />
    </header>
  );
}
