/**
 * bcryptjs-backed `PasswordHasher` implementation.
 *
 * This is the infrastructure-level wrapper that the domain's
 * `PasswordHasher` interface (`domain/use-cases/auth/AuthenticateUser.ts:6`)
 * expects. It is exported here so the presentation layer (e.g.
 * `account-deps.ts`) can wire it in without importing `bcryptjs`
 * directly. The salt rounds (10) match the existing auth flow
 * (`infrastructure/auth/auth.ts`, `app/(auth)/actions.ts`).
 */
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '@/domain/use-cases/auth/AuthenticateUser';

const SALT_ROUNDS = 10;

export const bcryptPasswordHasher: PasswordHasher = {
  hash: (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS),
  compare: (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword),
};
