import type { BrandRepository } from '@/domain/repositories/BrandRepository';
import { BrandNotFoundError } from './UpdateBrand';

export interface DeleteBrandInput {
  brandId: string;
}

export interface DeleteBrandDeps {
  brandRepository: BrandRepository;
}

/**
 * Admin use case: delete an existing brand by id. Throws
 * BrandNotFoundError if the id is unknown.
 */
export const deleteBrand = async (
  input: DeleteBrandInput,
  deps: DeleteBrandDeps,
): Promise<void> => {
  const existing = await deps.brandRepository.findById(input.brandId);
  if (!existing) {
    throw new BrandNotFoundError(input.brandId);
  }
  await deps.brandRepository.delete(input.brandId);
};
