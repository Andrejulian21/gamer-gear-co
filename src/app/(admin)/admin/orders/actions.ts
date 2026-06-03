'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { InvalidStatusTransitionError } from '@/domain/errors/AdminErrors';
import { OrderNotFoundError } from '@/domain/errors/OrderErrors';
import { OrderStatusSchema } from '@/domain/entities/OrderStatus';

const INPUT_SCHEMA = z.object({
  orderId: z.string().min(1),
  newStatus: OrderStatusSchema,
});

export type UpdateOrderStatusActionResult = { ok: true } | { ok: false; error: string };

/**
 * Update the status of an order from the admin detail page.
 *
 * Mirrors the existing checkout server action pattern: a typed
 * `useFormState`-style return shape (`{ ok, error }`) so the
 * client can render a toast without re-fetching.
 *
 * Steps:
 *  1. Auth-gate: refuse if no session OR role !== 'ADMIN'. The
 *     /admin/* middleware already enforces this, but a server
 *     action can be invoked from a form that was rendered for a
 *     non-admin (defense in depth).
 *  2. Validate the input with zod.
 *  3. Delegate to the use case, which enforces the lifecycle.
 *  4. Revalidate the orders list and the detail page.
 *
 * Errors are mapped to user-presentable Spanish strings; the
 * `InvalidStatusTransitionError` carries `from`/`to` so the
 * client can render a precise message.
 */
export async function updateOrderStatusAction(
  input: z.input<typeof INPUT_SCHEMA>,
): Promise<UpdateOrderStatusActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para realizar esta acción.' };
  }

  const parsed = INPUT_SCHEMA.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos.' };
  }
  const { orderId, newStatus } = parsed.data;

  const { updateOrderStatus } = getAdminDeps();
  try {
    await updateOrderStatus({ orderId, newStatus });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return { ok: false, error: 'Pedido no encontrado.' };
    }
    if (err instanceof InvalidStatusTransitionError) {
      return {
        ok: false,
        error: `Transición no permitida: ${err.from} → ${err.to}.`,
      };
    }
    // eslint-disable-next-line no-console
    console.error('[admin/orders] updateOrderStatusAction unexpected error:', err);
    return { ok: false, error: 'Error inesperado. Inténtalo de nuevo.' };
  }

  // Revalidate both the list and the detail page so the next
  // navigation re-fetches the latest status.
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
