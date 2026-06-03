'use client';

import { useState, useTransition } from 'react';
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

import { ImageUploadInput } from '../../_components/image-upload-input';
import { createBrandAction, updateBrandAction } from '../actions';
import type { Brand } from '@/domain/entities/Brand';

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

export interface BrandFormProps {
  brand?: Brand;
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

export function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter();
  const isEdit = Boolean(brand);
  const [isPending, startTransition] = useTransition();
  const [logo, setLogo] = useState<string>(brand?.logo ?? '');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(BRAND_FORM_SCHEMA),
    defaultValues: {
      name: brand?.name ?? '',
      slug: brand?.slug ?? '',
      logo: brand?.logo ?? '',
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
    setServerError(null);
    if (!logo) {
      setServerError('Subí un logo o pegá la URL de la imagen.');
      toast.error('El logo es requerido');
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set('name', values.name);
      formData.set('slug', values.slug);
      formData.set('logo', logo);

      const result = isEdit
        ? await updateBrandAction(brand!.id, formData)
        : await createBrandAction(formData);

      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Marca actualizada' : 'Marca creada');
      router.push('/admin/brands');
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
            <Label htmlFor="brand-name">Nombre</Label>
            <Input
              id="brand-name"
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
            <Label htmlFor="brand-slug">Slug</Label>
            <Input
              id="brand-slug"
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

      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploadInput
            name="logo"
            folder="brands"
            defaultValue={logo}
            onChange={setLogo}
            hint="Imagen cuadrada o apaisada. Se muestra en la ficha del producto."
          />
        </CardContent>
      </Card>

      {serverError ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 rounded-md border p-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/brands')}
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
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear marca'}
        </Button>
      </div>
    </form>
  );
}
