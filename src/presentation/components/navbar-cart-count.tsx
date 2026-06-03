import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';
import { CartCountBadgeClient } from './navbar-cart-count-client';
import { cn } from '@/presentation/lib/utils';

interface NavbarCartCountProps {
  className?: string;
}

/**
 * Server component that reads the user's cart count from the database
 * and hands it to a client subcomponent that owns the optimistic state.
 *
 * Returns `null` when the user is not signed in.
 *
 * Wrapped in `<Suspense>` by the navbar so the rest of the header can
 * stream immediately.
 */
export async function NavbarCartCount({ className }: NavbarCartCountProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const aggregate = await prisma.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });

  const initial = aggregate._sum.quantity ?? 0;

  return (
    <CartCountBadgeClient
      initial={initial}
      className={cn(
        'pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
        className,
      )}
    />
  );
}
