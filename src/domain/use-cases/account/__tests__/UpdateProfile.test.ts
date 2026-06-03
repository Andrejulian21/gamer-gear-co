import { describe, it, expect } from 'vitest';
import { updateProfile } from '../UpdateProfile';
import { createMockUserRepository } from '@/domain/__tests__/mocks';
import { EmailAlreadyInUseError, UserNotFoundError } from '@/domain/errors/AccountErrors';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'hashed',
  role: 'USER',
  ...overrides,
});

const makeDeps = (overrides: { userRepository?: UserRepository } = {}) => ({
  userRepository: overrides.userRepository ?? createMockUserRepository(),
});

describe('updateProfile', () => {
  it("updates the user's name", async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));

    const updated = await updateProfile(
      { userId: user.id, name: 'Alice Updated' },
      { userRepository: userRepo },
    );

    expect(updated.name).toBe('Alice Updated');
    expect(updated.email).toBe('a@x.com');
  });

  it("updates the user's email when it is not taken", async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));

    const updated = await updateProfile(
      { userId: user.id, email: 'new@x.com' },
      { userRepository: userRepo },
    );

    expect(updated.email).toBe('new@x.com');
    expect(userRepo.update).toHaveBeenCalledWith(user.id, { email: 'new@x.com' });
  });

  it('updates both name and email in one call', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));

    const updated = await updateProfile(
      { userId: user.id, name: 'Bob', email: 'b@x.com' },
      { userRepository: userRepo },
    );

    expect(updated.name).toBe('Bob');
    expect(updated.email).toBe('b@x.com');
  });

  it('throws EmailAlreadyInUseError when the new email is already taken by another user', async () => {
    const userRepo = createMockUserRepository();
    const me = await userRepo.create(makeUser({ email: 'me@x.com' }));
    await userRepo.create(makeUser({ email: 'taken@x.com' }));

    await expect(
      updateProfile({ userId: me.id, email: 'taken@x.com' }, { userRepository: userRepo }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('allows the user to "change" their email to the same value (no-op)', async () => {
    const userRepo = createMockUserRepository();
    const me = await userRepo.create(makeUser({ email: 'a@x.com' }));

    const updated = await updateProfile(
      { userId: me.id, email: 'a@x.com' },
      { userRepository: userRepo },
    );

    expect(updated.email).toBe('a@x.com');
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    const deps = makeDeps();
    await expect(updateProfile({ userId: 'missing', name: 'X' }, deps)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('throws when neither name nor email is provided', async () => {
    const userRepo = createMockUserRepository();
    const me = await userRepo.create(makeUser({ email: 'a@x.com' }));

    await expect(updateProfile({ userId: me.id }, { userRepository: userRepo })).rejects.toThrow();
  });
});
