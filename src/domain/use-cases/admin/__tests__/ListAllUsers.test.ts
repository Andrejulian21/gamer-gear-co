import { describe, it, expect } from 'vitest';
import { listAllUsers } from '../ListAllUsers';
import { createMockUserRepository } from '@/domain/__tests__/mocks';
import type { User } from '@/domain/entities/User';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'hashed',
  role: 'USER',
  ...overrides,
});

describe('listAllUsers (admin)', () => {
  it('paginates users', async () => {
    const userRepo = createMockUserRepository();
    for (let i = 1; i <= 25; i++) {
      await userRepo.create(
        makeUser({
          email: `u${i}@example.com`,
          name: `User ${i}`,
        }),
      );
    }

    const page1 = await listAllUsers({ page: 1, pageSize: 10 }, { userRepository: userRepo });
    const page2 = await listAllUsers({ page: 2, pageSize: 10 }, { userRepository: userRepo });

    expect(page1).toHaveLength(10);
    expect(page2).toHaveLength(10);
  });

  it('filters by search substring against name and email', async () => {
    const userRepo = createMockUserRepository();
    const alice = await userRepo.create(makeUser({ name: 'Alice', email: 'alice@x.com' }));
    await userRepo.create(makeUser({ name: 'Bob', email: 'bob@x.com' }));
    await userRepo.create(makeUser({ name: 'Charlie', email: 'charlie@x.com' }));

    const found = await listAllUsers(
      { page: 1, pageSize: 10, search: 'ali' },
      { userRepository: userRepo },
    );

    expect(found.map((u) => u.id)).toEqual([alice.id]);
  });

  it('returns an empty array when no users match the search', async () => {
    const userRepo = createMockUserRepository();
    await userRepo.create(makeUser({ name: 'Alice', email: 'a@x.com' }));

    const result = await listAllUsers(
      { page: 1, pageSize: 10, search: 'zzz-nothing-matches' },
      { userRepository: userRepo },
    );

    expect(result).toEqual([]);
  });
});
