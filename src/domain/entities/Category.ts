import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase, URL-safe (hyphens allowed)'),
  createdAt: z.date().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase, URL-safe (hyphens allowed)'),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const createCategory = (
  input: CreateCategoryInput & { id?: string; createdAt?: Date },
): Category => {
  const validated = CreateCategorySchema.parse(input);

  return CategorySchema.parse({
    id: input.id ?? crypto.randomUUID(),
    name: validated.name,
    slug: validated.slug,
    createdAt: input.createdAt,
  });
};
