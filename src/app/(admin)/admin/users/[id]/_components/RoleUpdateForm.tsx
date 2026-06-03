'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/presentation/components/ui/button';
import { updateUserRoleAction } from '../../actions';
import type { Role } from '@/domain/entities/Role';

interface RoleUpdateFormProps {
  targetUserId: string;
  currentRole: Role;
}

/**
 * Role-update form for the admin user detail.
 *
 * One select + one submit button. On success, reload so the page
 * picks up the new role (the server action also revalidates the
 * path). On error, surface the message as a toast.
 */
export function RoleUpdateForm({ targetUserId, currentRole }: RoleUpdateFormProps) {
  const [selected, setSelected] = useState<Role>(currentRole);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (selected === currentRole) return;
    startTransition(async () => {
      const result = await updateUserRoleAction({ targetUserId, newRole: selected });
      if (result.ok) {
        toast.success('Rol actualizado.');
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="user-role" className="text-xs font-medium text-muted-foreground">
            Cambiar rol a
          </label>
          <select
            id="user-role"
            value={selected}
            onChange={(e) => setSelected(e.target.value as Role)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <Button type="submit" disabled={isPending || selected === currentRole}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        No puedes degradar al último administrador del sistema.
      </p>
    </form>
  );
}
