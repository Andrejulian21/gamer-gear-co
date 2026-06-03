import Link from 'next/link';
import { ArrowRight, Gamepad2, Truck, ShieldCheck, Headphones } from 'lucide-react';
import { auth } from '@/infrastructure/auth/auth';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaCategoryRepository } from '@/infrastructure/repositories/PrismaCategoryRepository';
import { listProducts } from '@/domain/use-cases/products/ListProducts';
import { Button } from '@/presentation/components/ui/button';
import { ProductCard } from '@/presentation/components/product-card';
import { BrandCard } from '@/presentation/components/brand-card';
import { CATEGORY_ICONS } from '@/app/(shop)/_components/category-icons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  const productRepo = new PrismaProductRepository();
  const brandRepo = new PrismaBrandRepository();
  const categoryRepo = new PrismaCategoryRepository();

  const [featured, brands, categories] = await Promise.all([
    listProducts({ featured: true, limit: 8 }, { productRepository: productRepo }),
    brandRepo.findAll(),
    categoryRepo.findAll(),
  ]);

  const brandById = new Map(brands.map((b) => [b.id, b]));

  return (
    <>
      {/* Hero */}
      <section className="border-border/60 to-card/30 relative overflow-hidden border-b bg-gradient-to-b from-background via-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 0%, rgba(163,230,53,0.18), transparent 50%), radial-gradient(circle at 80% 30%, rgba(163,230,53,0.08), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="border-primary/30 bg-primary/10 mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
              Tienda oficial Colombia
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Periféricos gamer <span className="text-primary">de élite</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Mouse, teclados, audífonos y mousepads de Razer, Logitech G, Corsair, HyperX y
              Redragon. Pago con PSE, Nequi, Bancolombia y tarjetas.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Ver productos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/brands">Explorar marcas</Link>
              </Button>
            </div>
            {session?.user ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Hola, <span className="font-semibold text-foreground">{session.user.name}</span> (
                {session.user.role})
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Beneficios" className="border-border/60 border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Envío gratis +$300K</p>
              <p className="text-xs text-muted-foreground">A todo Colombia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Garantía oficial 12m</p>
              <p className="text-xs text-muted-foreground">En todos los productos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Soporte 24/7</p>
              <p className="text-xs text-muted-foreground">Por WhatsApp y email</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 ? (
        <section
          aria-labelledby="featured-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="font-display text-2xl font-bold sm:text-3xl">
                Destacados
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lo más buscado por la comunidad gamer en Colombia.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/products">
                Ver todo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((product) => (
              <li key={product.id}>
                <ProductCard product={product} brandName={brandById.get(product.brandId)?.name} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Categories */}
      {categories.length > 0 ? (
        <section
          aria-labelledby="categories-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <h2 id="categories-heading" className="mb-6 font-display text-2xl font-bold sm:text-3xl">
            Comprá por categoría
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] ?? CATEGORY_ICONS.default;
              return (
                <li key={category.id}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="border-border/60 hover:border-primary/40 group flex items-center gap-4 rounded-lg border bg-card p-5 transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Ver productos de la categoría ${category.name}`}
                  >
                    <span
                      aria-hidden="true"
                      className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-md text-primary"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <p className="font-display font-semibold">{category.name}</p>
                      <p className="text-xs text-muted-foreground">Ver productos &rarr;</p>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Brands */}
      {brands.length > 0 ? (
        <section
          aria-labelledby="brands-heading"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="brands-heading" className="font-display text-2xl font-bold sm:text-3xl">
                Nuestras marcas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Solo trabajamos con fabricantes líderes del mundo gaming.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/brands">
                Ver todas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {brands.map((brand) => (
              <li key={brand.id}>
                <BrandCard brand={brand} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* CTA */}
      {!session ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="border-primary/20 from-primary/5 flex flex-col items-center gap-4 rounded-2xl border bg-gradient-to-br via-card to-card p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Creá tu cuenta y comprá más rápido
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Guardá direcciones, mirá el historial de órdenes y comprá con un solo click.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">Crear cuenta</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
