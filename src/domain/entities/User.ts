import { z } from 'zod';
import { RoleSchema } from './Role';

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  hashedPassword: z.string().min(1),
  role: RoleSchema.default('USER'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name must not be empty'),
  hashedPassword: z.string().min(8, 'Password must be at least 8 characters'),
  role: RoleSchema.optional(),
});

export type CreateUserInput = z.input<typeof CreateUserSchema>;

export const createUser = (
  input: CreateUserInput & { id?: string; createdAt?: Date; updatedAt?: Date },
): User => {
  const validated = CreateUserSchema.parse({
    email: input.email,
    name: input.name,
    hashedPassword: input.hashedPassword,
    role: input.role,
  });

  return UserSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    email: validated.email,
    name: validated.name,
    hashedPassword: validated.hashedPassword,
    role: validated.role ?? 'USER',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
};
