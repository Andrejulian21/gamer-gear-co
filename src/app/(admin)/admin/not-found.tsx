import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';

/**
 * Admin 404. Generic — never leaks that /admin exists.
 * Match the dark zinc-950 palette of the admin shell.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40 text-muted-foreground">
        <FileQuestion className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La página que buscás no existe o fue movida.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
