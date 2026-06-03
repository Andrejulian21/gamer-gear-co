'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, MapPin, Pencil, Star, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Separator } from '@/presentation/components/ui/separator';
import { deleteAddressAction, setDefaultAddressAction } from '../_actions';
import { AddressForm } from './address-form';
import type { Address } from '@/domain/entities/Address';

interface AddressCardProps {
  address: Address;
}

/**
 * Address card (Phase 6).
 *
 * Renders a single address with three actions: edit (inline form
 * collapse), delete (with confirm), and set-default (only when not
 * already default). All actions are server-action driven; the edit
 * form is the same `<AddressForm />` used in add mode, just bound
 * with the address's id and values.
 */
export function AddressCard({ address }: AddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<'delete' | 'default' | null>(null);

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('¿Eliminar esta dirección? Esta acción no se puede deshacer.');
    if (!ok) return;
    setBusyAction('delete');
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('addressId', address.id);
        await deleteAddressAction(formData);
        toast.success('Dirección eliminada');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo eliminar la dirección';
        toast.error(message);
      } finally {
        setBusyAction(null);
      }
    });
  };

  const handleSetDefault = () => {
    setBusyAction('default');
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('addressId', address.id);
        await setDefaultAddressAction(formData);
        toast.success('Dirección predeterminada actualizada');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No se pudo marcar como predeterminada';
        toast.error(message);
      } finally {
        setBusyAction(null);
      }
    });
  };

  return (
    <div
      className="border-border/60 bg-card/50 rounded-xl border p-4 sm:p-5"
      data-testid="address-card"
      data-address-id={address.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="border-border/60 hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground sm:flex">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-sm font-semibold">{address.street}</p>
              {address.isDefault ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lime-300"
                  aria-label="Dirección predeterminada"
                  data-testid="default-badge"
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Predeterminada
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {address.city}, {address.state} · CP {address.zipCode}
            </p>
            <p className="text-xs text-muted-foreground">Tel: {address.phone}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!address.isDefault ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetDefault}
              disabled={isPending}
              className="gap-1"
            >
              {busyAction === 'default' ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              )}
              Marcar predeterminada
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing((v) => !v)}
            disabled={isPending}
            className="gap-1"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
            {isEditing ? 'Cerrar' : 'Editar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="hover:bg-destructive/10 gap-1 text-destructive hover:text-destructive"
          >
            {busyAction === 'delete' ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      {isEditing ? (
        <>
          <Separator className="my-4" />
          <AddressForm
            addressId={address.id}
            defaultValues={{
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              phone: address.phone,
              isDefault: address.isDefault,
            }}
            // In edit mode the only way to set default is via the
            // "Marcar predeterminada" button on the card itself —
            // hiding the checkbox here avoids confusion about which
            // control actually clears other defaults.
            hideDefaultCheckbox
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        </>
      ) : null}
    </div>
  );
}
