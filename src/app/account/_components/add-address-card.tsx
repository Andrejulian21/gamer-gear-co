'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Separator } from '@/presentation/components/ui/separator';
import { AddressForm } from './address-form';

interface AddAddressCardProps {
  /**
   * If a default address already exists, hide the "Marcar como
   * predeterminada" checkbox on the add form — we never stomp an
   * existing default (D5).
   */
  hideDefaultCheckbox: boolean;
}

/**
 * Add-address card (Phase 6).
 *
 * Closed by default — a "+ Agregar dirección" button expands an
 * inline `<AddressForm />` in create mode. The form resets the
 * collapsed state on success via `onSaved` (the form's own
 * unmount-side effect would also work, but a manual reset is
 * simpler and avoids stale form values lingering).
 */
export function AddAddressCard({ hideDefaultCheckbox }: AddAddressCardProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-center gap-2 border-dashed py-6 text-sm font-medium"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar nueva dirección
      </Button>
    );
  }

  return (
    <div
      className="border-border/60 bg-card/50 rounded-xl border p-4 sm:p-5"
      aria-label="Nueva dirección"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Nueva dirección</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar formulario"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Separator className="mb-4" />
      <AddressForm
        hideDefaultCheckbox={hideDefaultCheckbox}
        onCancel={() => setOpen(false)}
        onSaved={() => setOpen(false)}
      />
    </div>
  );
}
