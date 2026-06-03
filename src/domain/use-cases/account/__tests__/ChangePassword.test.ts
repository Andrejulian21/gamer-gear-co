import { describe, it, expect, vi } from 'vitest';
import { changePassword } from '../ChangePassword';
import { createMockUserRepository } from '@/domain/__tests__/mocks';
import { InvalidCurrentPasswordError, UserNotFoundError } from '@/domain/errors/AccountErrors';
import type { PasswordHasher } from '@/domain/use-cases/auth/AuthenticateUser';
import type { User } from '@/domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'old-hash',
  role: 'USER',
  ...overrides,
});

const makeHasher = (overrides: Partial<PasswordHasher> = {}): PasswordHasher => ({
  hash: vi.fn(async (pw: string) => `hashed:${pw}`),
  compare: vi.fn(async () => true),
  ...overrides,
});

describe('changePassword', () => {
  it('hashes the new password and persists it', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));
    const passwordHasher = makeHasher({
      compare: vi.fn(async () => true), // current matches
      hash: vi.fn(async (pw: string) => `new-hash:${pw}`),
    });

    await changePassword(
      { userId: user.id, currentPassword: 'old', newPassword: 'new-secret' },
      { userRepository: userRepo, passwordHasher },
    );

    expect(passwordHasher.compare).toHaveBeenCalledWith('old', 'old-hash');
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-secret');
    expect(userRepo.update).toHaveBeenCalledWith(user.id, {
      hashedPassword: 'new-hash:new-secret',
    });
  });

  it('returns void on success', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));
    const result = await changePassword(
      { userId: user.id, currentPassword: 'old', newPassword: 'new-secret' },
      { userRepository: userRepo, passwordHasher: makeHasher() },
    );
    expect(result).toBeUndefined();
  });

  it('throws InvalidCurrentPasswordError when the current password is wrong', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));
    const passwordHasher = makeHasher({ compare: vi.fn(async () => false) });

    await expect(
      changePassword(
        { userId: user.id, currentPassword: 'wrong', newPassword: 'new-secret' },
        { userRepository: userRepo, passwordHasher },
      ),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
  });

  it('does NOT hash or persist when the current password is wrong', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));
    const passwordHasher = makeHasher({ compare: vi.fn(async () => false) });

    await expect(
      changePassword(
        { userId: user.id, currentPassword: 'wrong', newPassword: 'new-secret' },
        { userRepository: userRepo, passwordHasher },
      ),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    const deps = {
      userRepository: createMockUserRepository(),
      passwordHasher: makeHasher(),
    };
    await expect(
      changePassword(
        { userId: 'missing', currentPassword: 'old', newPassword: 'new-secret' },
        deps,
      ),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws when newPassword is shorter than 8 characters', async () => {
    const userRepo = createMockUserRepository();
    const user = await userRepo.create(makeUser({ email: 'a@x.com' }));

    await expect(
      changePassword(
        { userId: user.id, currentPassword: 'old', newPassword: 'short' },
        { userRepository: userRepo, passwordHasher: makeHasher() },
      ),
    ).rejects.toThrow();
  });
});
