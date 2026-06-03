import { z } from 'zod';

export const RoleSchema = z.enum(['USER', 'ADMIN']);

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = z.infer<typeof RoleSchema>;
