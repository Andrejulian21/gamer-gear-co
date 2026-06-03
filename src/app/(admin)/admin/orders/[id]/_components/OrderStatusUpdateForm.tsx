'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { updateOrderStatusAction } from '../../actions';
import { OrderStatusBadge } from '@/app/(shop)/orders/_components/OrderStatusBadge';
import type { OrderStatus } from '@/domain/entities/OrderStatus';

interface OrderStatusUpdateFormProps {
  orderId: string;
  currentStatus: OrderStatus;
  allowedNext: ReadonlyArray<OrderStatus>;
}

/**
 * Status update form for the admin order detail.
 *
 * Server action wrapper. We use a local useState/useTransition pair
 * (not react-hook-form) because the form has exactly one field.
 * The action returns `{ ok: true } | { ok: false, error }` and we
 * toast the result. After a successful update we call
 * `router.refresh()` indirectly via `window.location.reload()` —
 * server actions don't automatically re-render the page; the
 * simpler approach is to reload, which also re-runs the server
 * component so the new status flows into the OrderStatusBadge
 * and the allowed-next list.
 */
export function OrderStatusUpdateForm({
  orderId,
  currentStatus,
  allowedNext,
}: OrderStatusUpdateFormProps) {
  const [selected, setSelected] = useState<OrderStatus | ''>('');
  const [isPending, startTransition] = useTransition();

  if (allowedNext.length === 0) {
    return (
      <div className="border-border/60 bg-muted/30 rounded-md border p-4 text-sm text-muted-foreground">
        Este pedido se encuentra en un estado terminal (
        <span className="font-medium text-foreground">{currentStatus}</span>) y no admite más
        transiciones.
      </div>
    );
  }

  const submit = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, newStatus: selected });
      if (result.ok) {
        toast.success('Estado del pedido actualizado.');
        // Reload so the new status + the recomputed allowedNext are
        // picked up by the server component.
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Estado actual:</span>
        <OrderStatusBadge status={currentStatus} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="order-new-status" className="text-xs font-medium text-muted-foreground">
            Cambiar a
          </label>
          <select
            id="order-new-status"
            value={selected}
            onChange={(e) => setSelected(e.target.value as OrderStatus)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="" disabled>
              Selecciona un estado…
            </option>
            {allowedNext.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={isPending || !selected}>
          {isPending ? 'Actualizando…' : 'Actualizar estado'}
        </Button>
      </div>
    </form>
  );
}
