import { Category, CreateCategoryInput } from '../entities/Category';

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  create(categoryData: CreateCategoryInput): Promise<Category>;
  update(id: string, data: Partial<CreateCategoryInput>): Promise<Category>;
  delete(id: string): Promise<void>;
}
