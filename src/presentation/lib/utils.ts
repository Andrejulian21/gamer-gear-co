import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and resolves Tailwind CSS conflicts
 * using tailwind-merge. This is the standard shadcn/ui utility.
 *
 * @example
 *   cn('p-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
