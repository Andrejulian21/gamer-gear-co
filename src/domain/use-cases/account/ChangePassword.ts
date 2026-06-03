import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { PasswordHasher } from '@/domain/use-cases/auth/AuthenticateUser';
import { UserNotFoundError, InvalidCurrentPasswordError } from '@/domain/errors/AccountErrors';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Change a user's password.
 *
 * Guards, in order:
 *   1. newPassword length (>= 8) — same rule as the auth/RegisterUser
 *      schema (User.ts:19) and the registration action.
 *   2. Existence: UserNotFoundError when the user id is unknown.
 *   3. Current password check via `passwordHasher.compare`. On
 *      mismatch, throw InvalidCurrentPasswordError WITHOUT hashing
 *      or writing anything.
 *
 * On success: hash the new password and update `hashedPassword` via
 * the user repository. The Prisma implementation maps `hashedPassword`
 * to its `password` column.
 *
 * `PasswordHasher` is imported (not redefined) from
 * `@/domain/use-cases/auth/AuthenticateUser` so the auth path and
 * the account path share one contract.
 */
export const changePassword = async (
  input: ChangePasswordInput,
  deps: ChangePasswordDeps,
): Promise<void> => {
  const { userId, currentPassword, newPassword } = input;

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await deps.userRepository.findById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }

  const matches = await deps.passwordHasher.compare(currentPassword, user.hashedPassword);
  if (!matches) {
    throw new InvalidCurrentPasswordError();
  }

  const hashedPassword = await deps.passwordHasher.hash(newPassword);
  await deps.userRepository.update(userId, { hashedPassword });
};
