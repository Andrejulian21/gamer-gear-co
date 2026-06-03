import type { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import type { Category, CreateCategoryInput } from '@/domain/entities/Category';

export interface CreateCategoryDeps {
  categoryRepository: CategoryRepository;
}

/**
 * Admin use case: create a new category. Slug and required-field
 * validation is handled by the `createCategory` factory inside the
 * Category entity (which throws a ZodError on bad input).
 */
export const createCategory = async (
  input: CreateCategoryInput,
  deps: CreateCategoryDeps,
): Promise<Category> => {
  return deps.categoryRepository.create(input);
};
