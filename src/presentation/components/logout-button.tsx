'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Button } from '@/presentation/components/ui/button';

export interface LogoutButtonProps {
  /** Where to send the user after signing out. Defaults to `/`. */
  callbackUrl?: string;
}

/**
 * Sign-out button (NextAuth v5).
 *
 * Extracted as a client component so we can call `signOut()` from
 * `next-auth/react`. The previous version used a `<form action="/api/auth/signout">`
 * which is the NextAuth v4 pattern — v5 changed the API and that endpoint
 * no longer clears the session reliably without a CSRF token round-trip.
 */
export function LogoutButton({ callbackUrl = '/' }: LogoutButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Cerrar sesion"
      onClick={() => {
        void signOut({ callbackUrl });
      }}
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
