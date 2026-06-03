/**
 * Domain-level errors for the Account aggregate (Phase 6 / Profile).
 *
 * Framework-agnostic — no Prisma, Next, NextAuth, or bcryptjs imports.
 *
 * `UserNotFoundError` is REUSED from `AdminErrors` (no need to
 * duplicate the same shape in two places).
 */

import { UserNotFoundError } from './AdminErrors';

export { UserNotFoundError };

/**
 * Thrown by `ChangePassword` when the supplied `currentPassword` does
 * not match the user's stored hash. Distinct from auth's
 * `InvalidCredentialsError` so the account layer can surface a more
 * specific error code.
 */
export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('The current password is incorrect');
    this.name = 'InvalidCurrentPasswordError';
  }
}

/**
 * Thrown by `UpdateProfile` when the requested new email is already
 * in use by another account. Prevents silent email takeovers.
 */
export class EmailAlreadyInUseError extends Error {
  constructor(public readonly email: string) {
    super(`Email "${email}" is already in use by another account`);
    this.name = 'EmailAlreadyInUseError';
  }
}
