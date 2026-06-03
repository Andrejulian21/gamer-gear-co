'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';

import { createCategoryAction, updateCategoryAction } from '../actions';
import type { Category } from '@/domain/entities/Category';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CATEGORY_FORM_SCHEMA = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(SLUG_PATTERN, 'Solo letras minúsculas, números y guiones'),
});

type CategoryFormValues = z.infer<typeof CATEGORY_FORM_SCHEMA>;

export interface CategoryFormProps {
  category?: Category;
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = Boolean(category);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(CATEGORY_FORM_SCHEMA),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
    },
    mode: 'onBlur',
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  const handleNameBlur = () => {
    const derived = slugify(nameValue);
    if (!derived) return;
    if (!slugValue || slugValue === slugify(slugValue)) {
      setValue('slug', derived, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('name', values.name);
      formData.set('slug', values.slug);

      const result = isEdit
        ? await updateCategoryAction(category!.id, formData)
        : await createCategoryAction(formData);

      if (!result.ok) {
        // Map field errors from the server onto the form for inline display.
        if (result.fieldErrors) {
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (v && v.length > 0 && (k === 'name' || k === 'slug')) {
              setError(k, { type: 'server', message: v[0] });
            }
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada');
      router.push('/admin/categories');
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              autoComplete="off"
              aria-invalid={errors.name ? 'true' : 'false'}
              {...register('name', { onBlur: handleNameBlur })}
            />
            {errors.name ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              autoComplete="off"
              aria-invalid={errors.slug ? 'true' : 'false'}
              {...register('slug')}
            />
            {errors.slug ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.slug.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Identificador URL. Se genera automáticamente desde el nombre.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/categories')}
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
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  );
}
