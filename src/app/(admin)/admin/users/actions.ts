'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import {
  CannotDemoteLastAdminError,
  CannotDemoteSelfError,
  UserNotFoundError,
} from '@/domain/errors/AdminErrors';
import { RoleSchema } from '@/domain/entities/Role';

const INPUT_SCHEMA = z.object({
  targetUserId: z.string().min(1),
  newRole: RoleSchema,
});

export type UpdateUserRoleActionResult = { ok: true } | { ok: false; error: string };

/**
 * Change a user's role from the admin detail page.
 *
 * Mirrors the orders update action: a typed result so the client
 * can toast without re-fetching.
 *
 * Auth: requires role === 'ADMIN' AND a session.user.id (the
 * use case takes requestingUserId so it can refuse self-demotion).
 *
 * Errors are mapped to user-presentable Spanish strings; the
 * CannotDemoteLastAdminError / CannotDemoteSelfError are domain
 * signals we surface verbatim.
 */
export async function updateUserRoleAction(
  input: z.input<typeof INPUT_SCHEMA>,
): Promise<UpdateUserRoleActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para realizar esta acción.' };
  }

  const parsed = INPUT_SCHEMA.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos.' };
  }
  const { targetUserId, newRole } = parsed.data;

  const { updateUserRole } = getAdminDeps();
  try {
    await updateUserRole({
      targetUserId,
      newRole,
      requestingUserId: session.user.id,
    });
  } catch (err) {
    if (err instanceof CannotDemoteSelfError) {
      return { ok: false, error: 'No puedes cambiar tu propio rol.' };
    }
    if (err instanceof CannotDemoteLastAdminError) {
      return {
        ok: false,
        error: 'No se puede degradar al último administrador del sistema.',
      };
    }
    if (err instanceof UserNotFoundError) {
      return { ok: false, error: 'Usuario no encontrado.' };
    }
    // eslint-disable-next-line no-console
    console.error('[admin/users] updateUserRoleAction unexpected error:', err);
    return { ok: false, error: 'Error inesperado. Inténtalo de nuevo.' };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true };
}
