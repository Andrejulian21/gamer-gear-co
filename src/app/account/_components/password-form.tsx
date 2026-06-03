'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { changePasswordAction } from '../_actions';

const PASSWORD_SCHEMA = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmNewPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  });

type PasswordFormValues = z.infer<typeof PASSWORD_SCHEMA>;

/**
 * Password change form (Phase 6).
 *
 * Three fields with cross-field validation (newPassword matches
 * confirmNewPassword). The action returns a `currentPassword` field
 * error on mismatch, which we surface via `setError`. On success the
 * form resets to clear the inputs — passwords are sensitive and
 * should not linger in the DOM.
 */
export function PasswordForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(PASSWORD_SCHEMA),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('currentPassword', values.currentPassword);
      formData.set('newPassword', values.newPassword);
      formData.set('confirmNewPassword', values.confirmNewPassword);

      const result = await changePasswordAction({}, formData);
      if (result.errors) {
        if (result.errors.currentPassword?.[0]) {
          setError('currentPassword', {
            type: 'server',
            message: result.errors.currentPassword[0],
          });
        } else if (result.errors.newPassword?.[0]) {
          setError('newPassword', {
            type: 'server',
            message: result.errors.newPassword[0],
          });
        } else if (result.errors.confirmNewPassword?.[0]) {
          setError('confirmNewPassword', {
            type: 'server',
            message: result.errors.confirmNewPassword[0],
          });
        } else if (result.errors._form?.[0]) {
          toast.error(result.errors._form[0]);
        }
        return;
      }
      toast.success(result.message ?? 'Contraseña actualizada');
      reset({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Cambiar contraseña">
      <Field
        label="Contraseña actual"
        htmlFor="password-current"
        error={errors.currentPassword?.message}
      >
        <Input
          id="password-current"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.currentPassword ? 'true' : 'false'}
          {...register('currentPassword')}
        />
      </Field>

      <Field
        label="Nueva contraseña"
        htmlFor="password-new"
        hint="Mínimo 8 caracteres."
        error={errors.newPassword?.message}
      >
        <Input
          id="password-new"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? 'true' : 'false'}
          {...register('newPassword')}
        />
      </Field>

      <Field
        label="Confirmar nueva contraseña"
        htmlFor="password-confirm"
        error={errors.confirmNewPassword?.message}
      >
        <Input
          id="password-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmNewPassword ? 'true' : 'false'}
          {...register('confirmNewPassword')}
        />
      </Field>

      <div className="flex items-center justify-end">
        <Button type="submit" size="sm" disabled={isPending || !isDirty} className="gap-1">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? 'Actualizando...' : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
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
