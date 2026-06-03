'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { cn } from '@/presentation/lib/utils';
import type { Product } from '@/domain/entities/Product';
import type { Brand } from '@/domain/entities/Brand';
import type { Category } from '@/domain/entities/Category';

import { ImageUploadInput } from '../../_components/image-upload-input';
import { createProductAction, updateProductAction } from '../actions';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PRODUCT_FORM_SCHEMA = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(SLUG_PATTERN, 'Solo letras minúsculas, números y guiones'),
  description: z.string().min(1, 'La descripción es requerida').max(5000),
  price: z
    .string()
    .min(1, 'El precio es requerido')
    .refine((s) => s.trim() !== '' && !isNaN(Number(s)) && Number(s) > 0, {
      message: 'El precio debe ser mayor a 0',
    }),
  stock: z
    .string()
    .min(1, 'El stock es requerido')
    .refine((s) => s.trim() !== '' && !isNaN(Number(s)) && Number(s) >= 0, {
      message: 'El stock no puede ser negativo',
    }),
  brandId: z.string().min(1, 'Selecciona una marca'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  featured: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof PRODUCT_FORM_SCHEMA>;

export interface ProductFormProps {
  product?: Product;
  brands: Brand[];
  categories: Category[];
}

/**
 * Slugify a product name. The same helper used on blur of the name
 * input to auto-derive a slug. Strips diacritics, lowercases, and
 * collapses non-alphanumerics to single hyphens.
 */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstImageUrl(images: string[] | undefined): string {
  return images && images.length > 0 ? (images[0] ?? '') : '';
}

/**
 * Product form (Phase 5, B1).
 *
 * Client component using react-hook-form + zod. The form handles
 * create + edit modes; the only difference is whether `product` is
 * passed. Submission goes through the create/update server actions
 * which re-validate server-side.
 */
export function ProductForm({ product, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [isPending, startTransition] = useTransition();
  const [primaryImage, setPrimaryImage] = useState<string>(firstImageUrl(product?.images));
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(PRODUCT_FORM_SCHEMA),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      price: product?.price != null ? String(product.price) : '0',
      stock: product?.stock != null ? String(product.stock) : '0',
      brandId: product?.brandId ?? brands[0]?.id ?? '',
      categoryId: product?.categoryId ?? categories[0]?.id ?? '',
      featured: product?.featured ?? false,
    },
    mode: 'onBlur',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-derive slug from name on blur of the name field, but only
  // when the slug is empty or still matches the previous
  // auto-derivation. Avoids clobbering an admin's manual slug edit.
  const handleNameBlur = () => {
    const derived = slugify(nameValue);
    if (!derived) return;
    if (!slugValue || slugValue === slugify(slugValue)) {
      setValue('slug', derived, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('name', values.name);
      formData.set('slug', values.slug);
      formData.set('description', values.description);
      formData.set('price', String(values.price));
      formData.set('stock', String(values.stock));
      formData.set('brandId', values.brandId);
      formData.set('categoryId', values.categoryId);
      formData.set('featured', values.featured ? 'on' : '');
      // The form only manages a single primary image. Submit it as
      // a one-element URL list — the entity schema requires an array.
      formData.set('images', primaryImage);

      const result = isEdit
        ? await updateProductAction(product!.id, formData)
        : await createProductAction(formData);

      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado');
      router.push('/admin/products');
      router.refresh();
    });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Nombre" htmlFor="product-name" error={errors.name?.message}>
                <Input
                  id="product-name"
                  autoComplete="off"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  {...register('name', { onBlur: handleNameBlur })}
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="product-slug"
                hint="Identificador URL. Se genera automáticamente desde el nombre."
                error={errors.slug?.message}
              >
                <Input
                  id="product-slug"
                  autoComplete="off"
                  aria-invalid={errors.slug ? 'true' : 'false'}
                  {...register('slug')}
                />
              </Field>

              <Field
                label="Descripción"
                htmlFor="product-description"
                error={errors.description?.message}
              >
                <textarea
                  id="product-description"
                  rows={5}
                  className={cn(
                    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  aria-invalid={errors.description ? 'true' : 'false'}
                  {...register('description')}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="text-base">Precio y stock</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Precio (COP)" htmlFor="product-price" error={errors.price?.message}>
                <Input
                  id="product-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="0.01"
                  aria-invalid={errors.price ? 'true' : 'false'}
                  {...register('price')}
                />
              </Field>
              <Field label="Stock" htmlFor="product-stock" error={errors.stock?.message}>
                <Input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="1"
                  aria-invalid={errors.stock ? 'true' : 'false'}
                  {...register('stock')}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="text-base">Imagen</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadInput
                name="primaryImage"
                folder="products"
                defaultValue={primaryImage}
                onChange={(v) => setPrimaryImage(v)}
                hint="Imagen principal del producto. Se mostrará en el catálogo."
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="text-base">Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Marca" htmlFor="product-brand" error={errors.brandId?.message}>
                <select
                  id="product-brand"
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  aria-invalid={errors.brandId ? 'true' : 'false'}
                  {...register('brandId')}
                >
                  {brands.length === 0 ? (
                    <option value="">Sin marcas — crea una primero</option>
                  ) : null}
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Categoría"
                htmlFor="product-category"
                error={errors.categoryId?.message}
              >
                <select
                  id="product-category"
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  aria-invalid={errors.categoryId ? 'true' : 'false'}
                  {...register('categoryId')}
                >
                  {categories.length === 0 ? (
                    <option value="">Sin categorías — crea una primero</option>
                  ) : null}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <FeaturedField register={register} />
            </CardContent>
          </Card>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 rounded-md border p-3 text-sm text-destructive lg:col-span-3"
          >
            {serverError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 lg:col-span-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/products')}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="gap-1">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function FeaturedField({ register }: { register: UseFormRegister<ProductFormValues> }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-input bg-background accent-lime-400"
        {...register('featured')}
      />
      <span>Marcar como producto destacado</span>
    </label>
  );
}
