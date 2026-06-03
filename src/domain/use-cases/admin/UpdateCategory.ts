import type { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import type { Category, CreateCategoryInput } from '@/domain/entities/Category';

export interface UpdateCategoryInput {
  categoryId: string;
  data: Partial<CreateCategoryInput>;
}

export interface UpdateCategoryDeps {
  categoryRepository: CategoryRepository;
}

/**
 * Admin use case: update an existing category. Throws
 * CategoryNotFoundError if the id is unknown.
 */
export class CategoryNotFoundError extends Error {
  constructor(public readonly categoryId: string) {
    super(`Category with id "${categoryId}" not found`);
    this.name = 'CategoryNotFoundError';
  }
}

export const updateCategory = async (
  input: UpdateCategoryInput,
  deps: UpdateCategoryDeps,
): Promise<Category> => {
  const existing = await deps.categoryRepository.findById(input.categoryId);
  if (!existing) {
    throw new CategoryNotFoundError(input.categoryId);
  }
  return deps.categoryRepository.update(input.categoryId, input.data);
};
