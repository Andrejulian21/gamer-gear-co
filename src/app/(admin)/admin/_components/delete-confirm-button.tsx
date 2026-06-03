'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, type ButtonProps } from '@/presentation/components/ui/button';
import { cn } from '@/presentation/lib/utils';

export interface DeleteConfirmButtonProps {
  /**
   * Async action invoked after the user confirms. Throw or return
   * rejected promise to surface an error toast. The component does
   * not interpret the return value on success.
   */
  action: () => Promise<void>;
  /** Visible label of the button. */
  label: string;
  /** Optional confirmation prompt. If omitted, no confirm() is shown. */
  confirmMessage?: string;
  /**
   * Optional path to push the router to after a successful action.
   * If omitted, the current page is revalidated (`router.refresh()`)
   * — useful when deleting a row from a list.
   */
  redirectTo?: string;
  /** Visual variant of the trigger button. */
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

/**
 * Reusable delete button with confirm + loading + toast feedback.
 *
 * Why a single component: every list page (products, brands, categories)
 * needs the same flow — confirm, run server action, toast, refresh.
 * Centralizing the pattern keeps each call site to one line.
 */
export function DeleteConfirmButton({
  action,
  label,
  confirmMessage,
  redirectTo,
  variant = 'destructive',
  size = 'sm',
  className,
}: DeleteConfirmButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (confirmMessage) {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(confirmMessage);
      if (!ok) return;
    }
    setIsLoading(true);
    startTransition(async () => {
      try {
        await action();
        toast.success(`${label} eliminado`);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo completar la acción';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const busy = isPending || isLoading;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={busy}
      className={cn('gap-1', className)}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      )}
      {busy ? 'Eliminando...' : label}
    </Button>
  );
}
