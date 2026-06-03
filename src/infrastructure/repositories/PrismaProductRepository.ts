import { prisma } from '../db/prisma';
import type {
  ProductRepository,
  ListProductsFilters,
} from '@/domain/repositories/ProductRepository';
import type { Product, CreateProductInput } from '@/domain/entities/Product';
import { Prisma } from '@prisma/client';

const toDomain = (p: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: Prisma.Decimal;
  stock: number;
  images: string[];
  brandId: string;
  categoryId: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Product => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price: p.price.toNumber(),
  stock: p.stock,
  images: p.images,
  brandId: p.brandId,
  categoryId: p.categoryId,
  featured: p.featured,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export class PrismaProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? toDomain(product) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { slug } });
    return product ? toDomain(product) : null;
  }

  async findMany(filters: ListProductsFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });
    return products.map(toDomain);
  }

  async count(filters: Omit<ListProductsFilters, 'limit' | 'offset'>): Promise<number> {
    const where: Prisma.ProductWhereInput = {};

    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    return prisma.product.count({ where });
  }

  async create(productData: CreateProductInput): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        price: new Prisma.Decimal(productData.price),
        stock: productData.stock,
        images: productData.images,
        brandId: productData.brandId,
        categoryId: productData.categoryId,
        featured: productData.featured,
      },
    });
    return toDomain(product);
  }

  async update(id: string, data: Partial<CreateProductInput>): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } };
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.featured !== undefined) updateData.featured = data.featured;

    const product = await prisma.product.update({ where: { id }, data: updateData });
    return toDomain(product);
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }
}
