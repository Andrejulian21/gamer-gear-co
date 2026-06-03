'use client';

import { useFormContext } from 'react-hook-form';

import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { cn } from '@/presentation/lib/utils';
import type { ShippingAddressInput } from '../actions';

type FieldName = keyof ShippingAddressInput;

const FIELDS: Array<{
  name: FieldName;
  label: string;
  type: 'text' | 'email' | 'tel';
  autoComplete: string;
  placeholder: string;
  span?: 'half' | 'full';
}> = [
  {
    name: 'fullName',
    label: 'Nombre completo',
    type: 'text',
    autoComplete: 'name',
    placeholder: 'Juan Pérez',
    span: 'full',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'tu@correo.com',
    span: 'half',
  },
  {
    name: 'phone',
    label: 'Teléfono',
    type: 'tel',
    autoComplete: 'tel',
    placeholder: '+57 300 000 0000',
    span: 'half',
  },
  {
    name: 'street',
    label: 'Dirección',
    type: 'text',
    autoComplete: 'street-address',
    placeholder: 'Calle 100 #15-20',
    span: 'full',
  },
  {
    name: 'city',
    label: 'Ciudad',
    type: 'text',
    autoComplete: 'address-level2',
    placeholder: 'Bogotá',
    span: 'half',
  },
  {
    name: 'state',
    label: 'Departamento',
    type: 'text',
    autoComplete: 'address-level1',
    placeholder: 'Cundinamarca',
    span: 'half',
  },
  {
    name: 'zipCode',
    label: 'Código postal',
    type: 'text',
    autoComplete: 'postal-code',
    placeholder: '110111',
    span: 'full',
  },
];

/**
 * RHF-wired shipping address fields. Pulls the `register`, `formState`
 * and context from `<FormProvider>` in `<CheckoutForm>`.
 *
 * Why a separate component: the checkout form's submit button,
 * provider, and OrderSummary live in `CheckoutForm`. This file
 * owns ONLY the field grid + per-field error messages.
 */
export function ShippingAddressFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ShippingAddressInput>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => {
        const error = errors[field.name]?.message;
        const span = field.span === 'full' ? 'sm:col-span-2' : 'sm:col-span-1';
        return (
          <div key={field.name} className={cn('space-y-1.5', span)}>
            <Label htmlFor={`shipping-${field.name}`}>{field.label}</Label>
            <Input
              id={`shipping-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `shipping-${field.name}-error` : undefined}
              {...register(field.name)}
            />
            {error ? (
              <p
                id={`shipping-${field.name}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {String(error)}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
