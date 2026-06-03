'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { updateProfileAction } from '../_actions';

const PROFILE_SCHEMA = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
});

type ProfileFormValues = z.infer<typeof PROFILE_SCHEMA>;

export interface ProfileFormProps {
  defaultName: string;
  defaultEmail: string;
}

/**
 * Profile form (Phase 6).
 *
 * RHF + zod because the form has two related fields and the email
 * uniqueness error from the server needs to flow into a per-field
 * error. The action returns the field-error object; we apply it
 * via `setError` so the same zod resolver-driven error UI shows it.
 */
export function ProfileForm({ defaultName, defaultEmail }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(PROFILE_SCHEMA),
    defaultValues: { name: defaultName, email: defaultEmail },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('name', values.name);
      formData.set('email', values.email);

      const result = await updateProfileAction({}, formData);
      if (result.errors) {
        if (result.errors.email?.[0]) {
          setError('email', { type: 'server', message: result.errors.email[0] });
        } else if (result.errors.name?.[0]) {
          setError('name', { type: 'server', message: result.errors.name[0] });
        } else if (result.errors._form?.[0]) {
          toast.error(result.errors._form[0]);
        }
        return;
      }
      toast.success(result.message ?? 'Perfil actualizado');
      // Sync the form state to the new values (no longer dirty) so the
      // submit button disables until the user changes something again.
      reset({ name: values.name, email: values.email });
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Datos de perfil">
      <Field label="Nombre" htmlFor="profile-name" error={errors.name?.message}>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={errors.name ? 'true' : 'false'}
          {...register('name')}
        />
      </Field>

      <Field label="Email" htmlFor="profile-email" error={errors.email?.message}>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
      </Field>

      <div className="flex items-center justify-end">
        <Button type="submit" size="sm" disabled={isPending || !isDirty} className="gap-1">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
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
