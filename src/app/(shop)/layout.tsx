import { auth } from '@/infrastructure/auth/auth';
import { ShopNavbar } from '@/presentation/components/shop-navbar';
import { ShopFooter } from './_components/shop-footer';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <ShopNavbar
        session={session ? { user: { name: session.user.name, role: session.user.role } } : null}
      />
      <main className="flex-1">{children}</main>
      <ShopFooter />
    </div>
  );
}
