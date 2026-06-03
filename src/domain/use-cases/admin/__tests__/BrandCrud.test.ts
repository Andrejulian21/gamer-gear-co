import { describe, it, expect } from 'vitest';
import { createBrand } from '../CreateBrand';
import { updateBrand, BrandNotFoundError } from '../UpdateBrand';
import { deleteBrand } from '../DeleteBrand';
import { createMockBrandRepository } from '@/domain/__tests__/mocks';
import type { CreateBrandInput } from '@/domain/entities/Brand';

const sampleInput: CreateBrandInput = {
  name: 'Razer',
  slug: 'razer',
  logo: 'https://cdn.example.com/razer.png',
};

describe('createBrand (admin)', () => {
  it('creates a brand via the repository', async () => {
    const brandRepo = createMockBrandRepository();
    const created = await createBrand(sampleInput, { brandRepository: brandRepo });

    expect(created.name).toBe('Razer');
    expect(created.slug).toBe('razer');
    expect(brandRepo.create).toHaveBeenCalledWith(sampleInput);
  });
});

describe('updateBrand (admin)', () => {
  it('updates an existing brand', async () => {
    const brandRepo = createMockBrandRepository();
    const existing = await brandRepo.create({ ...sampleInput, slug: 'razer' });

    const updated = await updateBrand(
      { brandId: existing.id, data: { logo: 'https://cdn.example.com/new.png' } },
      { brandRepository: brandRepo },
    );

    expect(updated.id).toBe(existing.id);
    expect(updated.logo).toBe('https://cdn.example.com/new.png');
  });

  it('throws BrandNotFoundError when the brand does not exist', async () => {
    const brandRepo = createMockBrandRepository();

    await expect(
      updateBrand({ brandId: 'missing', data: { name: 'X' } }, { brandRepository: brandRepo }),
    ).rejects.toBeInstanceOf(BrandNotFoundError);
  });
});

describe('deleteBrand (admin)', () => {
  it('deletes an existing brand', async () => {
    const brandRepo = createMockBrandRepository();
    const existing = await brandRepo.create({ ...sampleInput, slug: 'razer' });

    await deleteBrand({ brandId: existing.id }, { brandRepository: brandRepo });

    const after = await brandRepo.findById(existing.id);
    expect(after).toBeNull();
  });

  it('throws BrandNotFoundError when the brand does not exist', async () => {
    const brandRepo = createMockBrandRepository();

    await expect(
      deleteBrand({ brandId: 'missing' }, { brandRepository: brandRepo }),
    ).rejects.toBeInstanceOf(BrandNotFoundError);
  });
});
