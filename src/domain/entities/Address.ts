import { z } from 'zod';

export const AddressSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
  isDefault: z.boolean().default(false),
  createdAt: z.date().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

export const CreateAddressSchema = z.object({
  userId: z.string().min(1),
  street: z.string().min(1, 'Street must not be empty'),
  city: z.string().min(1, 'City must not be empty'),
  state: z.string().min(1, 'State must not be empty'),
  zipCode: z.string().min(1, 'Zip code must not be empty'),
  phone: z.string().min(1, 'Phone must not be empty'),
  isDefault: z.boolean().optional().default(false),
});

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

export const createAddress = (
  input: CreateAddressInput & { id?: string; createdAt?: Date },
): Address => {
  const validated = CreateAddressSchema.parse(input);

  return AddressSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    userId: validated.userId,
    street: validated.street,
    city: validated.city,
    state: validated.state,
    zipCode: validated.zipCode,
    phone: validated.phone,
    isDefault: validated.isDefault,
    createdAt: input.createdAt,
  });
};
