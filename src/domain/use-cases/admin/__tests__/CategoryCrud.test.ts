import { describe, it, expect } from 'vitest';
import { createCategory } from '../CreateCategory';
import { updateCategory, CategoryNotFoundError } from '../UpdateCategory';
import { deleteCategory } from '../DeleteCategory';
import { createMockCategoryRepository } from '@/domain/__tests__/mocks';
import type { CreateCategoryInput } from '@/domain/entities/Category';

const sampleInput: CreateCategoryInput = {
  name: 'Keyboards',
  slug: 'keyboards',
};

describe('createCategory (admin)', () => {
  it('creates a category via the repository', async () => {
    const categoryRepo = createMockCategoryRepository();
    const created = await createCategory(sampleInput, { categoryRepository: categoryRepo });

    expect(created.name).toBe('Keyboards');
    expect(created.slug).toBe('keyboards');
    expect(categoryRepo.create).toHaveBeenCalledWith(sampleInput);
  });
});

describe('updateCategory (admin)', () => {
  it('updates an existing category', async () => {
    const categoryRepo = createMockCategoryRepository();
    const existing = await categoryRepo.create({ ...sampleInput, slug: 'keyboards' });

    const updated = await updateCategory(
      { categoryId: existing.id, data: { name: 'Mechanical Keyboards' } },
      { categoryRepository: categoryRepo },
    );

    expect(updated.id).toBe(existing.id);
    expect(updated.name).toBe('Mechanical Keyboards');
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    const categoryRepo = createMockCategoryRepository();

    await expect(
      updateCategory(
        { categoryId: 'missing', data: { name: 'X' } },
        { categoryRepository: categoryRepo },
      ),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});

describe('deleteCategory (admin)', () => {
  it('deletes an existing category', async () => {
    const categoryRepo = createMockCategoryRepository();
    const existing = await categoryRepo.create({ ...sampleInput, slug: 'keyboards' });

    await deleteCategory({ categoryId: existing.id }, { categoryRepository: categoryRepo });

    const after = await categoryRepo.findById(existing.id);
    expect(after).toBeNull();
  });

  it('throws CategoryNotFoundError when the category does not exist', async () => {
    const categoryRepo = createMockCategoryRepository();

    await expect(
      deleteCategory({ categoryId: 'missing' }, { categoryRepository: categoryRepo }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
