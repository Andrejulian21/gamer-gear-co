import { prisma } from '../db/prisma';
import type { BrandRepository } from '@/domain/repositories/BrandRepository';
import type { Brand, CreateBrandInput } from '@/domain/entities/Brand';
import { Prisma } from '@prisma/client';

const toDomain = (b: {
  id: string;
  name: string;
  slug: string;
  logo: string;
  createdAt: Date;
}): Brand => ({
  id: b.id,
  name: b.name,
  slug: b.slug,
  logo: b.logo,
  createdAt: b.createdAt,
});

export class PrismaBrandRepository implements BrandRepository {
  async findById(id: string): Promise<Brand | null> {
    const brand = await prisma.brand.findUnique({ where: { id } });
    return brand ? toDomain(brand) : null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    return brand ? toDomain(brand) : null;
  }

  async findAll(): Promise<Brand[]> {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    return brands.map(toDomain);
  }

  async create(brandData: CreateBrandInput): Promise<Brand> {
    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        slug: brandData.slug,
        logo: brandData.logo,
      },
    });
    return toDomain(brand);
  }

  async update(id: string, data: Partial<CreateBrandInput>): Promise<Brand> {
    const updateData: Prisma.BrandUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.logo !== undefined) updateData.logo = data.logo;

    const brand = await prisma.brand.update({ where: { id }, data: updateData });
    return toDomain(brand);
  }

  async delete(id: string): Promise<void> {
    await prisma.brand.delete({ where: { id } });
  }
}
