import { describe, it, expect, vi } from 'vitest';
import { registerUser, RegisterUserError } from '../RegisterUser';
import { createMockUserRepository } from '@/domain/__tests__/mocks';

describe('registerUser', () => {
  const makePasswordHasher = () => vi.fn(async (plain: string) => `hashed:${plain}`);

  it('creates a user successfully with hashed password', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    const user = await registerUser(
      {
        email: 'jane@example.com',
        name: 'Jane Doe',
        password: 'supersecret',
        role: 'USER',
      },
      { userRepository: userRepo, passwordHasher: hash },
    );

    expect(hash).toHaveBeenCalledWith('supersecret');
    expect(user.email).toBe('jane@example.com');
    expect(user.name).toBe('Jane Doe');
    expect(user.hashedPassword).toBe('hashed:supersecret');
    expect(user.role).toBe('USER');
    expect(user.id).toBeDefined();
    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@example.com',
        name: 'Jane Doe',
        hashedPassword: 'hashed:supersecret',
        role: 'USER',
      }),
    );
  });

  it('defaults role to USER when not provided', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    const user = await registerUser(
      { email: 'jane@example.com', name: 'Jane', password: 'supersecret' },
      { userRepository: userRepo, passwordHasher: hash },
    );

    expect(user.role).toBe('USER');
  });

  it('throws when email already exists', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    await registerUser(
      { email: 'taken@example.com', name: 'A', password: 'supersecret' },
      { userRepository: userRepo, passwordHasher: hash },
    );

    await expect(
      registerUser(
        { email: 'taken@example.com', name: 'B', password: 'anotherone' },
        { userRepository: userRepo, passwordHasher: hash },
      ),
    ).rejects.toThrow(RegisterUserError);
  });

  it('throws when password is shorter than 8 characters', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    await expect(
      registerUser(
        { email: 'jane@example.com', name: 'Jane', password: 'short' },
        { userRepository: userRepo, passwordHasher: hash },
      ),
    ).rejects.toThrow(/at least 8 characters/);
  });

  it('throws when email is invalid', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    await expect(
      registerUser(
        { email: 'not-an-email', name: 'Jane', password: 'supersecret' },
        { userRepository: userRepo, passwordHasher: hash },
      ),
    ).rejects.toThrow();
  });

  it('throws when name is empty', async () => {
    const userRepo = createMockUserRepository();
    const hash = makePasswordHasher();

    await expect(
      registerUser(
        { email: 'jane@example.com', name: '', password: 'supersecret' },
        { userRepository: userRepo, passwordHasher: hash },
      ),
    ).rejects.toThrow();
  });
});
