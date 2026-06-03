import type { CategoryRepository } from '@/domain/repositories/CategoryRepository';
import { CategoryNotFoundError } from './UpdateCategory';

export interface DeleteCategoryInput {
  categoryId: string;
}

export interface DeleteCategoryDeps {
  categoryRepository: CategoryRepository;
}

/**
 * Admin use case: delete an existing category by id. Throws
 * CategoryNotFoundError if the id is unknown.
 */
export const deleteCategory = async (
  input: DeleteCategoryInput,
  deps: DeleteCategoryDeps,
): Promise<void> => {
  const existing = await deps.categoryRepository.findById(input.categoryId);
  if (!existing) {
    throw new CategoryNotFoundError(input.categoryId);
  }
  await deps.categoryRepository.delete(input.categoryId);
};
