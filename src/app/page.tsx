import { auth } from '@/infrastructure/auth/auth';
import { logoutAction } from '@/app/(auth)/actions';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Gamer Gear Colombia
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Los mejores periféricos gamer de Razer, Logitech G, Corsair, HyperX y Redragon.
        </p>
        <p className="mt-2 text-sm text-gray-500">Pago con PSE, Nequi, Bancolombia y tarjetas.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {session ? (
            <>
              <p className="text-sm text-gray-600">
                Hola, <span className="font-semibold">{session.user.name}</span> (
                {session.user.role})
              </p>
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
                >
                  Panel de admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Crear cuenta
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
                Iniciar sesión <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
