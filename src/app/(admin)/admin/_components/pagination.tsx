import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/presentation/lib/utils';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total number of pages (>= 1). */
  totalPages: number;
  /** Path used to build the href. Should not include the query string. */
  basePath: string;
}

/**
 * Lightweight pagination control.
 *
 * Renders a "← Anterior" + page indicator + "Siguiente →" pair.
 * Disables the boundary buttons instead of rendering dead links.
 * Builds hrefs as `${basePath}?page=${n}` and drops the query on page 1
 * so the URL stays clean.
 */
export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.max(1, Math.min(page, totalPages));
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const prevHref = hasPrev ? buildHref(basePath, safePage - 1) : undefined;
  const nextHref = hasNext ? buildHref(basePath, safePage + 1) : undefined;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-4"
    >
      <p className="text-xs text-muted-foreground">
        Página {safePage} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink href={prevHref} disabled={!hasPrev} direction="prev">
          Anterior
        </PaginationLink>
        <PaginationLink href={nextHref} disabled={!hasNext} direction="next">
          Siguiente
        </PaginationLink>
      </div>
    </nav>
  );
}

interface PaginationLinkProps {
  href: string | undefined;
  disabled: boolean;
  direction: 'prev' | 'next';
  children: React.ReactNode;
}

function PaginationLink({ href, disabled, direction, children }: PaginationLinkProps) {
  const baseClasses =
    'inline-flex h-9 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-colors';
  const disabledClasses =
    'pointer-events-none border-zinc-800 bg-zinc-900/40 text-muted-foreground/50';
  const enabledClasses =
    'border-zinc-800 bg-zinc-900/60 text-foreground hover:border-zinc-700 hover:bg-zinc-900';

  if (disabled || !href) {
    return (
      <span aria-disabled="true" className={cn(baseClasses, disabledClasses)}>
        {direction === 'prev' ? <ChevronLeft className="h-3 w-3" aria-hidden="true" /> : null}
        {children}
        {direction === 'next' ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
      </span>
    );
  }

  return (
    <Link href={href} className={cn(baseClasses, enabledClasses)}>
      {direction === 'prev' ? <ChevronLeft className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
      {direction === 'next' ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
    </Link>
  );
}

function buildHref(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}
