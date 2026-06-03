'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/infrastructure/auth/auth';
import { getAdminDeps } from '@/presentation/lib/admin-deps';
import { NotFoundError as UpdateNotFoundError } from '@/domain/use-cases/admin/UpdateProduct';
import { ProductNotFoundError } from '@/domain/use-cases/admin/DeleteProduct';
import { createProduct } from '@/domain/entities/Product';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PRODUCT_FORM_SCHEMA = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(SLUG_PATTERN, 'Solo letras minúsculas, números y guiones'),
  description: z.string().min(1, 'La descripción es requerida').max(5000),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  stock: z.coerce
    .number()
    .int('El stock debe ser un entero')
    .nonnegative('El stock no puede ser negativo'),
  // Comma- or newline-separated URL list. Empty after split -> [].
  images: z
    .string()
    .optional()
    .transform((s) =>
      (s ?? '')
        .split(/[\n,]/)
        .map((u) => u.trim())
        .filter((u) => u.length > 0),
    ),
  brandId: z.string().min(1, 'Selecciona una marca'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  featured: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')])
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
});

type ProductFormValues = z.infer<typeof PRODUCT_FORM_SCHEMA>;

export type ProductActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Coerce + validate the FormData, returning a flat error object the
 * client can render. Centralized so the two actions share one
 * implementation.
 */
function parseProductForm(
  formData: FormData,
): { ok: true; values: ProductFormValues } | { ok: false; result: ProductActionResult } {
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    images: formData.get('images') ?? '',
    brandId: formData.get('brandId'),
    categoryId: formData.get('categoryId'),
    featured: formData.get('featured') ?? '',
  };

  const parsed = PRODUCT_FORM_SCHEMA.safeParse(raw);
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

/**
 * Create a new product. Auth-gated to ADMIN. We delegate slug/field
 * validation to zod and call the entity factory (`createProduct`) so
 * the persisted shape matches the domain contract.
 *
 * The `createProduct` factory in the entity throws ZodError on
 * invalid input — we let that bubble up to the framework's error
 * boundary. The zod parse in `parseProductForm` is the line of
 * defense for user-friendly field errors.
 */
export async function createProductAction(formData: FormData): Promise<ProductActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para crear productos.' };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();

  try {
    // Validate the domain input (this throws on bad slugs/names,
    // independent of the form-level zod parse).
    const validInput = createProduct({
      name: parsed.values.name,
      slug: parsed.values.slug,
      description: parsed.values.description,
      price: parsed.values.price,
      stock: parsed.values.stock,
      images: parsed.values.images,
      brandId: parsed.values.brandId,
      categoryId: parsed.values.categoryId,
      featured: parsed.values.featured,
    });

    // No `createProduct` use case shipped in alpha (only update/delete),
    // so we call the repository directly through the deps factory. The
    // admin-deps.ts comment explicitly says repos are exposed for
    // exactly this kind of bypass.
    const created = await deps.productRepository.create({
      name: validInput.name,
      slug: validInput.slug,
      description: validInput.description,
      price: validInput.price,
      stock: validInput.stock,
      images: validInput.images,
      brandId: validInput.brandId,
      categoryId: validInput.categoryId,
      featured: validInput.featured,
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/products');

    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato del producto.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo crear el producto';
    return { ok: false, error: message };
  }
}

/**
 * Update an existing product. Same auth + zod pattern as create.
 * Calls the alpha-shipped `updateProduct` use case.
 */
export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ProductActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para editar productos.' };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.result;

  const deps = getAdminDeps();

  try {
    await deps.updateProduct({
      productId: id,
      data: {
        name: parsed.values.name,
        slug: parsed.values.slug,
        description: parsed.values.description,
        price: parsed.values.price,
        stock: parsed.values.stock,
        images: parsed.values.images,
        brandId: parsed.values.brandId,
        categoryId: parsed.values.categoryId,
        featured: parsed.values.featured,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/products/edit/${id}`);
    revalidatePath('/products');

    return { ok: true, id };
  } catch (err) {
    if (err instanceof UpdateNotFoundError) {
      return { ok: false, error: 'El producto no existe.' };
    }
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Los datos no cumplen el formato del producto.',
        fieldErrors: err.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const message = err instanceof Error ? err.message : 'No se pudo actualizar el producto';
    return { ok: false, error: message };
  }
}

/**
 * Delete a product by id. Throws ProductNotFoundError when missing;
 * we map that to a friendly message. After success, the action
 * redirects to the list page (server actions are best at triggering
 * navigations from forms with `action={action}`).
 */
export async function deleteProductAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'No tienes permisos para eliminar productos.' };
  }

  const deps = getAdminDeps();
  try {
    await deps.deleteProduct({ productId: id });
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/products');
    return { ok: true };
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return { ok: false, error: 'El producto no existe.' };
    }
    const message = err instanceof Error ? err.message : 'No se pudo eliminar el producto';
    return { ok: false, error: message };
  }
}

/**
 * Server-side form action used by the <form action={...}> pattern on
 * the create/edit pages. RHF-free — the form posts plain fields and
 * we either redirect on success or re-render the page with an error
 * banner via the `useFormState` hook on the client.
 *
 * For richer error display (per-field) the client also calls
 * createProductAction / updateProductAction directly from the RHF
 * submit handler. This entry point exists so the form keeps working
 * without JavaScript.
 */
export async function createProductFormAction(formData: FormData): Promise<void> {
  const result = await createProductAction(formData);
  if (result.ok) {
    redirect('/admin/products');
  }
  // On error, re-render the page; the form will pick up the error
  // through the form-state hook (wired by the page component).
  throw new Error(result.error);
}

export async function updateProductFormAction(id: string, formData: FormData): Promise<void> {
  const result = await updateProductAction(id, formData);
  if (result.ok) {
    redirect('/admin/products');
  }
  throw new Error(result.error);
}
