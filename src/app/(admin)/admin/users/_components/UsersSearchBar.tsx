'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';

interface UsersSearchBarProps {
  initialSearch: string;
}

/**
 * Search bar for the admin users list.
 *
 * Client form. Submits via GET so the URL stays the source of
 * truth (the server component reads `?search=...`). A pending
 * indicator disables the button while the navigation is in flight.
 */
export function UsersSearchBar({ initialSearch }: UsersSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const submit = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page on a new search.
    params.delete('page');
    if (next) {
      params.set('search', next);
    } else {
      params.delete('search');
    }
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <form
      role="search"
      aria-label="Buscar usuarios"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="users-search" className="text-xs font-medium text-muted-foreground">
          Buscar por nombre o email
        </label>
        <Input
          id="users-search"
          name="search"
          type="search"
          placeholder="Ej. juan@example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Buscando…' : 'Buscar'}
      </Button>
    </form>
  );
}
