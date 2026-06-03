'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, User as UserIcon, Shield } from 'lucide-react';

export type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: 'USER' | 'ADMIN' | string;
};

export function UserMenu({
  user,
  logoutAction,
}: {
  user: SessionUser;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const initials = (user.name ?? user.email ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de usuario"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-2 pr-3 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 font-mono text-xs font-bold text-zinc-950"
        >
          {initials}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{user.name ?? user.email}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de usuario"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40"
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="truncate text-sm font-medium text-zinc-100">{user.name ?? 'Usuario'}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            {user.role && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <Shield className="h-3 w-3" aria-hidden="true" />
                {user.role}
              </span>
            )}
          </div>
          <div className="py-1">
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
              >
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                Panel de admin
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-zinc-50 focus:bg-zinc-800 focus:outline-none"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
