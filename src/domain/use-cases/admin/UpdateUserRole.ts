import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';
import type { Role } from '@/domain/entities/Role';
import {
  CannotDemoteSelfError,
  CannotDemoteLastAdminError,
  UserNotFoundError,
} from '@/domain/errors/AdminErrors';

export interface UpdateUserRoleInput {
  targetUserId: string;
  newRole: Role;
  requestingUserId: string;
}

export interface UpdateUserRoleDeps {
  userRepository: UserRepository;
}

/**
 * Admin use case: change a user's role (USER <-> ADMIN).
 *
 * Guards, in order:
 *   1. Self-edit prevention: an admin cannot change their own role.
 *   2. Missing target: if the target user id is unknown, throw
 *      UserNotFoundError.
 *   3. Last-admin preservation: if the target is currently an ADMIN
 *      and the new role is USER, we count remaining admins. If the
 *      target is the only admin, we refuse.
 *
 * On success the user is updated via the repository and the new
 * User entity is returned.
 */
export const updateUserRole = async (
  input: UpdateUserRoleInput,
  deps: UpdateUserRoleDeps,
): Promise<User> => {
  const { targetUserId, newRole, requestingUserId } = input;

  if (targetUserId === requestingUserId) {
    throw new CannotDemoteSelfError();
  }

  const target = await deps.userRepository.findById(targetUserId);
  if (!target) {
    throw new UserNotFoundError(targetUserId);
  }

  if (target.role === 'ADMIN' && newRole === 'USER') {
    const adminCount = await deps.userRepository.countByRole('ADMIN');
    if (adminCount <= 1) {
      throw new CannotDemoteLastAdminError();
    }
  }

  return deps.userRepository.update(targetUserId, { role: newRole });
};
