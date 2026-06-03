import type { BrandRepository } from '@/domain/repositories/BrandRepository';
import type { Brand, CreateBrandInput } from '@/domain/entities/Brand';

export interface CreateBrandDeps {
  brandRepository: BrandRepository;
}

/**
 * Admin use case: create a new brand.
 *
 * Validation (slug format, required fields) is delegated to the
 * `createBrand` factory inside the Brand entity, which throws a
 * ZodError on invalid input.
 */
export const createBrand = async (
  input: CreateBrandInput,
  deps: CreateBrandDeps,
): Promise<Brand> => {
  return deps.brandRepository.create(input);
};
