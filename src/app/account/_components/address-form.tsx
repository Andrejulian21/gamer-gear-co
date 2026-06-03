'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { cn } from '@/presentation/lib/utils';

import { addAddressAction, updateAddressAction } from '../_actions';

const ADDRESS_SCHEMA = z.object({
  street: z.string().min(1, 'Ingresa la dirección'),
  city: z.string().min(1, 'Ingresa la ciudad'),
  state: z.string().min(1, 'Ingresa el departamento'),
  zipCode: z.string().min(1, 'Ingresa el código postal'),
  phone: z.string().min(7, 'Ingresa un teléfono válido'),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof ADDRESS_SCHEMA>;

interface BaseAddressFormProps {
  /** When true, the form is in "edit" mode (sends addressId in the payload). */
  addressId?: string;
  defaultValues?: Partial<AddressFormValues>;
  /**
   * If there is already a default address for the user, the caller
   * passes `true` to hide the "isDefault" checkbox (we never stomp an
   * existing default — D5). When `false`, the checkbox is shown AND
   * pre-checked — the first address a user adds should be the
   * default unless they explicitly say otherwise.
   */
  hideDefaultCheckbox: boolean;
  onCancel?: () => void;
  onSaved?: () => void;
}

export type AddressFormProps = BaseAddressFormProps;

/**
 * Address form (Phase 6).
 *
 * Used in BOTH the "add new" and "edit" modes. The caller passes an
 * optional `addressId`; when present, the submit handler routes to
 * `updateAddressAction`. Otherwise it adds a new address.
 *
 * The "Marcar como predeterminada" checkbox is only meaningful when
 * the user has no default address yet; the caller passes
 * `hideDefaultCheckbox` to suppress it in the edit case and when a
 * default already exists.
 */
export function AddressForm({
  addressId,
  defaultValues,
  hideDefaultCheckbox,
  onCancel,
  onSaved,
}: AddressFormProps) {
  const isEdit = Boolean(addressId);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(ADDRESS_SCHEMA),
    defaultValues: {
      street: defaultValues?.street ?? '',
      city: defaultValues?.city ?? '',
      state: defaultValues?.state ?? '',
      zipCode: defaultValues?.zipCode ?? '',
      phone: defaultValues?.phone ?? '',
      // In "add" mode (no addressId) on a fresh, default-less user
      // the form is going to receive a hideDefaultCheckbox=false and
      // the user expects the new address to become the default —
      // pre-check the box. When hideDefaultCheckbox is true (a
      // default already exists), default isDefault to false so the
      // new address does not stomp the existing default.
      // In "edit" mode the caller passes the actual isDefault value
      // and we want to preserve it.
      isDefault: defaultValues?.isDefault ?? (!isEdit && !hideDefaultCheckbox),
    },
    mode: 'onBlur',
  });

  const isDefault = watch('isDefault');

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('street', values.street);
      formData.set('city', values.city);
      formData.set('state', values.state);
      formData.set('zipCode', values.zipCode);
      formData.set('phone', values.phone);
      formData.set('isDefault', values.isDefault ? 'on' : '');

      const result = isEdit
        ? await updateAddressAction(
            {},
            // Re-build the formData to include the addressId in edit mode.
            (() => {
              formData.set('addressId', addressId!);
              return formData;
            })(),
          )
        : await addAddressAction({}, formData);

      if (result.errors) {
        // Per-field errors first.
        const fieldNames = ['street', 'city', 'state', 'zipCode', 'phone'] as const;
        let surfaced = false;
        for (const f of fieldNames) {
          if (result.errors[f]?.[0]) {
            setError(f, { type: 'server', message: result.errors[f]![0] });
            surfaced = true;
          }
        }
        if (!surfaced && result.errors._form?.[0]) {
          setServerError(result.errors._form[0]);
          toast.error(result.errors._form[0]);
        }
        return;
      }
      toast.success(result.message ?? (isEdit ? 'Dirección actualizada' : 'Dirección agregada'));
      onSaved?.();
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4"
      aria-label={isEdit ? 'Editar dirección' : 'Agregar dirección'}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Dirección"
          htmlFor={`address-street-${addressId ?? 'new'}`}
          error={errors.street?.message}
          span="full"
        >
          <Input
            id={`address-street-${addressId ?? 'new'}`}
            autoComplete="street-address"
            aria-invalid={errors.street ? 'true' : 'false'}
            {...register('street')}
          />
        </Field>
        <Field
          label="Ciudad"
          htmlFor={`address-city-${addressId ?? 'new'}`}
          error={errors.city?.message}
        >
          <Input
            id={`address-city-${addressId ?? 'new'}`}
            autoComplete="address-level2"
            aria-invalid={errors.city ? 'true' : 'false'}
            {...register('city')}
          />
        </Field>
        <Field
          label="Departamento"
          htmlFor={`address-state-${addressId ?? 'new'}`}
          error={errors.state?.message}
        >
          <Input
            id={`address-state-${addressId ?? 'new'}`}
            autoComplete="address-level1"
            aria-invalid={errors.state ? 'true' : 'false'}
            {...register('state')}
          />
        </Field>
        <Field
          label="Código postal"
          htmlFor={`address-zip-${addressId ?? 'new'}`}
          error={errors.zipCode?.message}
        >
          <Input
            id={`address-zip-${addressId ?? 'new'}`}
            autoComplete="postal-code"
            aria-invalid={errors.zipCode ? 'true' : 'false'}
            {...register('zipCode')}
          />
        </Field>
        <Field
          label="Teléfono"
          htmlFor={`address-phone-${addressId ?? 'new'}`}
          error={errors.phone?.message}
        >
          <Input
            id={`address-phone-${addressId ?? 'new'}`}
            type="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? 'true' : 'false'}
            {...register('phone')}
          />
        </Field>
      </div>

      {!hideDefaultCheckbox ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <Checkbox
            checked={isDefault}
            onCheckedChange={(checked) =>
              setValue('isDefault', Boolean(checked), {
                shouldValidate: true,
              })
            }
            aria-label="Marcar como predeterminada"
          />
          <span>Marcar como predeterminada</span>
        </label>
      ) : null}

      {serverError ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 rounded-md border p-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isPending} className="gap-1">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isEdit ? (
            <Save className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar dirección'}
        </Button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  span?: 'half' | 'full';
  children: React.ReactNode;
}

function Field({ label, htmlFor, error, span = 'half', children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', span === 'full' ? 'sm:col-span-2' : 'sm:col-span-1')}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
