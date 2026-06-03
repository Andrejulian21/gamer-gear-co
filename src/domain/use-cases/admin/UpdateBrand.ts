import type { BrandRepository } from '@/domain/repositories/BrandRepository';
import type { Brand, CreateBrandInput } from '@/domain/entities/Brand';

export interface UpdateBrandInput {
  brandId: string;
  data: Partial<CreateBrandInput>;
}

export interface UpdateBrandDeps {
  brandRepository: BrandRepository;
}

/**
 * Admin use case: update an existing brand. Throws BrandNotFoundError
 * if the id is unknown.
 */
export class BrandNotFoundError extends Error {
  constructor(public readonly brandId: string) {
    super(`Brand with id "${brandId}" not found`);
    this.name = 'BrandNotFoundError';
  }
}

export const updateBrand = async (
  input: UpdateBrandInput,
  deps: UpdateBrandDeps,
): Promise<Brand> => {
  const existing = await deps.brandRepository.findById(input.brandId);
  if (!existing) {
    throw new BrandNotFoundError(input.brandId);
  }
  return deps.brandRepository.update(input.brandId, input.data);
};
