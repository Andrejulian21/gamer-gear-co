import { describe, it, expect } from 'vitest';
import { updateUserRole } from '../UpdateUserRole';
import { createMockUserRepository } from '@/domain/__tests__/mocks';
import {
  CannotDemoteSelfError,
  CannotDemoteLastAdminError,
  UserNotFoundError,
} from '@/domain/errors/AdminErrors';
import type { User } from '@/domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'hashed',
  role: 'USER',
  ...overrides,
});

describe('updateUserRole (admin)', () => {
  it('promotes USER -> ADMIN', async () => {
    const userRepo = createMockUserRepository();
    const target = await userRepo.create(makeUser({ email: 'target@x.com' }));

    const updated = await updateUserRole(
      { targetUserId: target.id, newRole: 'ADMIN', requestingUserId: 'admin-1' },
      { userRepository: userRepo },
    );

    expect(updated.role).toBe('ADMIN');
  });

  it('demotes ADMIN -> USER when more than one admin exists', async () => {
    const userRepo = createMockUserRepository();
    const admin1 = await userRepo.create(makeUser({ email: 'a1@x.com', role: 'ADMIN' }));
    const admin2 = await userRepo.create(makeUser({ email: 'a2@x.com', role: 'ADMIN' }));

    const updated = await updateUserRole(
      { targetUserId: admin2.id, newRole: 'USER', requestingUserId: admin1.id },
      { userRepository: userRepo },
    );

    expect(updated.role).toBe('USER');
  });

  it('throws CannotDemoteSelfError when targetUserId === requestingUserId', async () => {
    const userRepo = createMockUserRepository();
    const admin = await userRepo.create(makeUser({ email: 'admin@x.com', role: 'ADMIN' }));

    await expect(
      updateUserRole(
        { targetUserId: admin.id, newRole: 'USER', requestingUserId: admin.id },
        { userRepository: userRepo },
      ),
    ).rejects.toBeInstanceOf(CannotDemoteSelfError);
  });

  it('throws CannotDemoteLastAdminError when demoting the only admin', async () => {
    const userRepo = createMockUserRepository();
    const admin = await userRepo.create(makeUser({ email: 'admin@x.com', role: 'ADMIN' }));
    await userRepo.create(makeUser({ email: 'user@x.com', role: 'USER' }));

    await expect(
      updateUserRole(
        { targetUserId: admin.id, newRole: 'USER', requestingUserId: 'some-other-admin' },
        { userRepository: userRepo },
      ),
    ).rejects.toBeInstanceOf(CannotDemoteLastAdminError);
  });

  it('throws UserNotFoundError when the target user does not exist', async () => {
    const userRepo = createMockUserRepository();

    await expect(
      updateUserRole(
        { targetUserId: 'missing', newRole: 'USER', requestingUserId: 'admin-1' },
        { userRepository: userRepo },
      ),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
