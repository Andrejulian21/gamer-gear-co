import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BrandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase, URL-safe (hyphens allowed)'),
  logo: z.string().min(1),
  createdAt: z.date().optional(),
});

export type Brand = z.infer<typeof BrandSchema>;

export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase, URL-safe (hyphens allowed)'),
  logo: z.string().min(1, 'Logo URL must not be empty'),
});

export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;

export const createBrand = (input: CreateBrandInput & { id?: string; createdAt?: Date }): Brand => {
  const validated = CreateBrandSchema.parse(input);

  return BrandSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    name: validated.name,
    slug: validated.slug,
    logo: validated.logo,
    createdAt: input.createdAt,
  });
};
