import { Brand, CreateBrandInput } from '../entities/Brand';

export interface BrandRepository {
  findById(id: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  findAll(): Promise<Brand[]>;
  create(brandData: CreateBrandInput): Promise<Brand>;
  update(id: string, data: Partial<CreateBrandInput>): Promise<Brand>;
  delete(id: string): Promise<void>;
}
