'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { Button } from '@/presentation/components/ui/button';
import { OrderStatus, type OrderStatus as OrderStatusType } from '@/domain/entities/OrderStatus';

interface OrdersFilterBarProps {
  currentStatus: OrderStatusType | undefined;
}

/**
 * Status filter for the admin orders list.
 *
 * Client component. Renders a <select> with one option per
 * OrderStatus plus a "Todos" reset. Submitting the form navigates
 * the browser to the corresponding URL via router.push so the
 * server component re-renders with the new filter. The current
 * status is reflected in the select's value on first render.
 */
export function OrdersFilterBar({ currentStatus }: OrdersFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>(currentStatus ?? '');
  const [isPending, startTransition] = useTransition();

  const apply = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset page when the filter changes.
      params.delete('page');
      if (next) {
        params.set('status', next);
      } else {
        params.delete('status');
      }
      startTransition(() => {
        router.push(`/admin/orders?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <form
      role="search"
      aria-label="Filtrar pedidos por estado"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        apply(status);
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="orders-status" className="text-xs font-medium text-muted-foreground">
          Estado
        </label>
        <select
          id="orders-status"
          name="status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            apply(e.target.value);
          }}
          className="h-10 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Todos</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {describe(s)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        Aplicar
      </Button>
    </form>
  );
}

function describe(s: OrderStatusType): string {
  switch (s) {
    case 'PENDING':
      return 'Pendiente';
    case 'PAID':
      return 'Pagado';
    case 'SHIPPED':
      return 'Enviado';
    case 'DELIVERED':
      return 'Entregado';
    case 'CANCELLED':
      return 'Cancelado';
    case 'FAILED':
      return 'Pago fallido';
  }
}
