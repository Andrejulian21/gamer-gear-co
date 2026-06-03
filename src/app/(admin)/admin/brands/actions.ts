'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { BrandNotFoundError } from '@/domain/use-cases/admin/UpdateBrand';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BRAND_FORM_SCHEMA = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(SLUG_PATTERN, 'Solo letras minúsculas, números y guiones'),
  logo: z.string().min(1, 'El logo es requerido'),
});

type BrandFormValues = z.infer<typeof BRAND_FORM_SCHEMA>;

export type BrandActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parseBrandForm(
  formData: FormData,
): { ok: true; values: BrandFormValues } | { ok: false; result: BrandActionResult } {
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    logo: formData.get('logo'),
  };
  const parsed = BRAND_FORM_SCHEMA.safeParse(raw);
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

export async function createBrandAction(formData: FormData): Promise<BrandActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para crear marcas.' };
  }

  const parsed = parseBrandForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();
  try {
    const created = await deps.createBrand(parsed.values);
    revalidatePath('/admin/brands');
    revalidatePath('/admin/dashboard');
    revalidatePath('/brands');
    revalidatePath('/products');
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato de la marca.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo crear la marca';
    return { ok: false, error: message };
  }
}

export async function updateBrandAction(
  id: string,
  formData: FormData,
): Promise<BrandActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para editar marcas.' };
  }

  const parsed = parseBrandForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();
  try {
    await deps.updateBrand({ brandId: id, data: parsed.values });
    revalidatePath('/admin/brands');
    revalidatePath(`/admin/brands/edit/${id}`);
    revalidatePath('/brands');
    revalidatePath('/products');
    return { ok: true, id };
  } catch (err) {
    if (err instanceof BrandNotFoundError) {
      return { ok: false, error: 'La marca no existe.' };
    }
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato de la marca.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo actualizar la marca';
    return { ok: false, error: message };
  }
}

export async function deleteBrandAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para eliminar marcas.' };
  }

  const deps = getAdminDeps();
  try {
    await deps.deleteBrand({ brandId: id });
    revalidatePath('/admin/brands');
    revalidatePath('/admin/dashboard');
    revalidatePath('/brands');
    revalidatePath('/products');
    return { ok: true };
  } catch (err) {
    if (err instanceof BrandNotFoundError) {
      return { ok: false, error: 'La marca no existe.' };
    }
    // Prisma will throw a P2003 (foreign key constraint) if the
    // brand still has products. Surface a friendly message.
    const message = err instanceof Error ? err.message : 'No se pudo eliminar la marca';
    if (message.includes('Foreign key constraint') || message.includes('P2003')) {
      return {
        ok: false,
        error: 'No se puede eliminar la marca porque tiene productos asociados.',
      };
    }
    return { ok: false, error: message };
  }
}
