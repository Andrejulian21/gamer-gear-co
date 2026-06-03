import { Badge } from '@/presentation/components/ui/badge';
import { cn } from '@/presentation/lib/utils';
import type { OrderStatus } from '@/domain/entities/OrderStatus';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Order status badge with status-specific colors.
 *
 * Reuses the existing `<Badge>` primitive from
 * `@/presentation/components/ui/badge.tsx`. Color is communicated
 * via Tailwind utility classes (not a new variant) so the palette
 * stays centralized in `tailwind.config.ts`.
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { label, classes } = describe(status);

  return (
    <Badge
      variant="outline"
      className={cn('border text-[10px] font-medium uppercase tracking-wider', classes, className)}
      aria-label={`Estado del pedido: ${label}`}
    >
      {label}
    </Badge>
  );
}

function describe(status: OrderStatus): { label: string; classes: string } {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pendiente',
        classes: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      };
    case 'PAID':
      return {
        label: 'Pagado',
        classes: 'border-lime-400/40 bg-lime-400/10 text-lime-300',
      };
    case 'FAILED':
      return {
        label: 'Pago fallido',
        classes: 'border-red-500/40 bg-red-500/10 text-red-300',
      };
    case 'SHIPPED':
      return {
        label: 'Enviado',
        classes: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
      };
    case 'DELIVERED':
      return {
        label: 'Entregado',
        classes: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelado',
        classes: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
      };
  }
}
