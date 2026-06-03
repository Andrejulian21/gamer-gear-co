import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';
import { UserNotFoundError, EmailAlreadyInUseError } from '@/domain/errors/AccountErrors';

export interface UpdateProfileInput {
  userId: string;
  name?: string;
  email?: string;
}

export interface UpdateProfileDeps {
  userRepository: UserRepository;
}

/**
 * Update a user's profile (name and/or email).
 *
 * Guards, in order:
 *   1. At least one of `name` or `email` must be provided — otherwise
 *      the call is a no-op and we reject to keep the API honest.
 *   2. Existence: throw UserNotFoundError if the user is missing.
 *   3. Email uniqueness: when the email is changing, look it up via
 *      `findByEmail`. If a *different* user already owns it, throw
 *      EmailAlreadyInUseError. (A user "changing" their email to its
 *      current value is allowed — it's a no-op.)
 *
 * On success, the user is updated and the new User entity is returned.
 */
export const updateProfile = async (
  input: UpdateProfileInput,
  deps: UpdateProfileDeps,
): Promise<User> => {
  const { userId, name, email } = input;

  if (name === undefined && email === undefined) {
    throw new Error('updateProfile requires at least one of `name` or `email`');
  }

  const user = await deps.userRepository.findById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }

  const data: { name?: string; email?: string } = {};
  if (name !== undefined) data.name = name;

  if (email !== undefined && email !== user.email) {
    const existing = await deps.userRepository.findByEmail(email);
    if (existing && existing.id !== userId) {
      throw new EmailAlreadyInUseError(email);
    }
    data.email = email;
  } else if (email !== undefined) {
    // Email unchanged: still record it so the date bump on the row
    // reflects the call, but the unique-constraint check is skipped.
    data.email = email;
  }

  return deps.userRepository.update(userId, data);
};
