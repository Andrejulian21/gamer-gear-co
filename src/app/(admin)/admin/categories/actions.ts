'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { CategoryNotFoundError } from '@/domain/use-cases/admin/UpdateCategory';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CATEGORY_FORM_SCHEMA = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(SLUG_PATTERN, 'Solo letras minúsculas, números y guiones'),
});

type CategoryFormValues = z.infer<typeof CATEGORY_FORM_SCHEMA>;

export type CategoryActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parseCategoryForm(
  formData: FormData,
): { ok: true; values: CategoryFormValues } | { ok: false; result: CategoryActionResult } {
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
  };
  const parsed = CATEGORY_FORM_SCHEMA.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        error: 'Revisa los datos del formulario.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }
  return { ok: true, values: parsed.data };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para crear categorías.' };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();
  try {
    const created = await deps.createCategory(parsed.values);
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');
    revalidatePath('/products');
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato de la categoría.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo crear la categoría';
    return { ok: false, error: message };
  }
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<CategoryActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para editar categorías.' };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();
  try {
    await deps.updateCategory({ categoryId: id, data: parsed.values });
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/edit/${id}`);
    revalidatePath('/products');
    return { ok: true, id };
  } catch (err) {
    if (err instanceof CategoryNotFoundError) {
      return { ok: false, error: 'La categoría no existe.' };
    }
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato de la categoría.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo actualizar la categoría';
    return { ok: false, error: message };
  }
}

export async function deleteCategoryAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para eliminar categorías.' };
  }

  const deps = getAdminDeps();
  try {
    await deps.deleteCategory({ categoryId: id });
    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');
    revalidatePath('/products');
    return { ok: true };
  } catch (err) {
    if (err instanceof CategoryNotFoundError) {
      return { ok: false, error: 'La categoría no existe.' };
    }
    const message = err instanceof Error ? err.message : 'No se pudo eliminar la categoría';
    if (message.includes('Foreign key constraint') || message.includes('P2003')) {
      return {
        ok: false,
        error: 'No se puede eliminar la categoría porque tiene productos asociados.',
      };
    }
    return { ok: false, error: message };
  }
}
