import type { Metadata } from 'next';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { BrandCard } from '@/presentation/components/brand-card';

export const metadata: Metadata = {
  title: 'Marcas — Gamer Gear Colombia',
  description:
    'Trabajamos con las marcas más importantes del mundo gamer: Razer, Logitech G, Corsair, HyperX y Redragon.',
};

export default async function BrandsPage() {
  const brandRepo = new PrismaBrandRepository();
  const productRepo = new PrismaProductRepository();

  const brands = await brandRepo.findAll();
  const counts = await Promise.all(brands.map((brand) => productRepo.count({ brandId: brand.id })));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Marcas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trabajamos solo con marcas líderes del mundo gaming.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brands.map((brand, index) => (
          <li key={brand.id}>
            <BrandCard brand={brand} productCount={counts[index]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
