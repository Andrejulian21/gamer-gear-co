import { prisma } from '../db/prisma';
import type { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import type { Category, CreateCategoryInput } from '@/domain/entities/Category';
import { Prisma } from '@prisma/client';

const toDomain = (c: { id: string; name: string; slug: string; createdAt: Date }): Category => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  createdAt: c.createdAt,
});

export class PrismaCategoryRepository implements CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ where: { id } });
    return category ? toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ where: { slug } });
    return category ? toDomain(category) : null;
  }

  async findAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return categories.map(toDomain);
  }

  async create(categoryData: CreateCategoryInput): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
      },
    });
    return toDomain(category);
  }

  async update(id: string, data: Partial<CreateCategoryInput>): Promise<Category> {
    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    return toDomain(category);
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }
}
