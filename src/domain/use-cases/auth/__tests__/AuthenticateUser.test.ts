import { describe, it, expect, vi } from 'vitest';
import { authenticateUser } from '../AuthenticateUser';
import { createMockUserRepository } from '@/domain/__tests__/mocks';

describe('authenticateUser', () => {
  const makePasswordHasher = (compareImpl: (plain: string, hash: string) => Promise<boolean>) => ({
    hash: vi.fn(async (plain: string) => `hashed:${plain}`),
    compare: vi.fn(compareImpl),
  });

  it('returns the user when credentials are valid', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = makePasswordHasher(async () => true);

    await userRepo.create({
      email: 'jane@example.com',
      name: 'Jane',
      hashedPassword: 'hashed:supersecret',
    });

    const user = await authenticateUser(
      { email: 'jane@example.com', password: 'supersecret' },
      { userRepository: userRepo, passwordHasher },
    );

    expect(user.email).toBe('jane@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith('supersecret', 'hashed:supersecret');
  });

  it('throws Invalid credentials when user is not found', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = makePasswordHasher(async () => true);

    await expect(
      authenticateUser(
        { email: 'missing@example.com', password: 'whatever' },
        { userRepository: userRepo, passwordHasher },
      ),
    ).rejects.toThrow(/invalid credentials/i);
  });

  it('throws Invalid credentials when password does not match', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = makePasswordHasher(async () => false);

    await userRepo.create({
      email: 'jane@example.com',
      name: 'Jane',
      hashedPassword: 'hashed:supersecret',
    });

    await expect(
      authenticateUser(
        { email: 'jane@example.com', password: 'wrongpass' },
        { userRepository: userRepo, passwordHasher },
      ),
    ).rejects.toThrow(/invalid credentials/i);
  });
});
