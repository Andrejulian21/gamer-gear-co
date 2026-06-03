import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().regex(SLUG_PATTERN),
  description: z.string().min(1),
  price: z.number().positive('Price must be a positive number'),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer'),
  images: z.array(z.string().url().or(z.string().min(1))).default([]),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  featured: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  slug: z.string().regex(SLUG_PATTERN, 'Slug must be lowercase, URL-safe (hyphens allowed)'),
  description: z.string().min(1, 'Description must not be empty'),
  price: z.number().positive('Price must be a positive number'),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer'),
  images: z.array(z.string()).default([]),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  featured: z.boolean().optional().default(false),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const createProduct = (
  input: CreateProductInput & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  },
): Product => {
  const validated = CreateProductSchema.parse(input);

  return ProductSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    name: validated.name,
    slug: validated.slug,
    description: validated.description,
    price: validated.price,
    stock: validated.stock,
    images: validated.images,
    brandId: validated.brandId,
    categoryId: validated.categoryId,
    featured: validated.featured,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
};
