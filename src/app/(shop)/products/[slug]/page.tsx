import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Package, ShieldCheck, Truck } from 'lucide-react';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBrandRepository } from '@/infrastructure/repositories/PrismaBrandRepository';
import { PrismaCategoryRepository } from '@/infrastructure/repositories/PrismaCategoryRepository';
import { getProductBySlug } from '@/domain/use-cases/products/GetProductBySlug';
import { auth } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';
import { formatCOP } from '@/presentation/lib/price-format';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Separator } from '@/presentation/components/ui/separator';
import { AddToCartButton } from './_add-to-cart-button';

interface PageProps {
  params: { slug: string };
}

async function loadProduct(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    return await getProductBySlug(slug, {
      productRepository: new PrismaProductRepository(),
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await loadProduct(params.slug);
  if (!product) {
    return { title: 'Producto no encontrado — Gamer Gear Colombia' };
  }
  return {
    title: `${product.name} — Gamer Gear Colombia`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await loadProduct(params.slug);
  if (!product) notFound();

  const [brandRepo, categoryRepo] = [new PrismaBrandRepository(), new PrismaCategoryRepository()];
  const [brand, category] = await Promise.all([
    brandRepo.findById(product.brandId),
    categoryRepo.findById(product.categoryId),
  ]);

  const session = await auth();
  const initialCartCount = session?.user?.id
    ? ((
        await prisma.cartItem.aggregate({
          where: { userId: session.user.id },
          _sum: { quantity: true },
        })
      )._sum.quantity ?? 0)
    : 0;

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-foreground">
              Productos
            </Link>
          </li>
          {category ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li className="truncate text-foreground" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="border-border/60 relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {brand ? (
                <Link href={`/brands/${brand.slug}`}>
                  <Badge variant="outline" className="hover:border-primary/60">
                    {brand.name}
                  </Badge>
                </Link>
              ) : null}
              {product.featured ? (
                <Badge variant="default" aria-label="Producto destacado">
                  Destacado
                </Badge>
              ) : null}
              {!inStock ? (
                <Badge variant="destructive">Agotado</Badge>
              ) : lowStock ? (
                <Badge variant="secondary">Pocas unidades</Badge>
              ) : (
                <Badge variant="outline">Disponible</Badge>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p
              className="font-display text-3xl font-bold text-primary"
              aria-label={`Precio ${formatCOP(product.price)}`}
            >
              {formatCOP(product.price)}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="mb-2 font-display text-base font-semibold">Descripción</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <AddToCartButton
              productId={product.id}
              slug={params.slug}
              inStock={inStock}
              maxQuantity={product.stock}
              initialCartCount={initialCartCount}
            />
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4" aria-hidden="true" />
                Envío gratis a partir de $300.000 COP
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Garantía oficial de 12 meses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Button asChild variant="ghost" size="sm">
          <Link href="/products">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Volver a productos
          </Link>
        </Button>
      </div>
    </div>
  );
}
