import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { listProducts } from '@/domain/use-cases/products/ListProducts';
import { ProductCard } from '@/presentation/components/product-card';
import { Button } from '@/presentation/components/ui/button';
import { EmptyState } from '@/presentation/components/empty-state';
import { SearchX } from 'lucide-react';

interface PageProps {
  params: { slug: string };
}

async function loadBrandAndProducts(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const brandRepo = new PrismaBrandRepository();
  const productRepo = new PrismaProductRepository();
  const brand = await brandRepo.findBySlug(slug);
  if (!brand) return null;
  const products = await listProducts(
    { brandId: brand.id, limit: 60 },
    { productRepository: productRepo },
  );
  return { brand, products };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadBrandAndProducts(params.slug);
  if (!data) {
    return { title: 'Marca no encontrada — Gamer Gear Colombia' };
  }
  return {
    title: `${data.brand.name} — Gamer Gear Colombia`,
    description: `Productos de la marca ${data.brand.name}. Periféricos gamer originales con envío a todo Colombia.`,
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const data = await loadBrandAndProducts(params.slug);
  if (!data) notFound();

  const { brand, products } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/brands">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Todas las marcas
        </Link>
      </Button>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{brand.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length === 0
            ? 'Sin productos'
            : `${products.length} ${products.length === 1 ? 'producto' : 'productos'} disponibles`}
        </p>
      </header>

      {products.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
          title="Aún no hay productos de esta marca"
          description="Volvé pronto o explorá otras marcas."
          action={
            <Button asChild variant="outline">
              <Link href="/brands">Ver todas las marcas</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} brandName={brand.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
