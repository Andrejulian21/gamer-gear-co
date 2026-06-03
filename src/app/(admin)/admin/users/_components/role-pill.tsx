import { Badge } from '@/presentation/components/ui/badge';
import { cn } from '@/presentation/lib/utils';
import type { Role } from '@/domain/entities/Role';

interface RolePillProps {
  role: Role;
  className?: string;
}

/**
 * Small role badge for the admin users list and detail.
 *
 * USER -> zinc-tones (passive).
 * ADMIN -> lime-tones (matches the brand accent).
 */
export function RolePill({ role, className }: RolePillProps) {
  const classes =
    role === 'ADMIN'
      ? 'border-lime-400/40 bg-lime-400/10 text-lime-300'
      : 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300';

  return (
    <Badge
      variant="outline"
      className={cn('border text-[10px] font-medium uppercase tracking-wider', classes, className)}
      aria-label={`Rol: ${role}`}
    >
      {role}
    </Badge>
  );
}
