import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';

export interface ListAllUsersInput {
  page: number;
  pageSize: number;
  search?: string;
}

export interface ListAllUsersDeps {
  userRepository: UserRepository;
}

/**
 * Admin use case: paginated user listing, optionally filtered by a
 * case-insensitive substring against name and email. Newest users
 * first (delegated to the repository).
 */
export const listAllUsers = async (
  input: ListAllUsersInput,
  deps: ListAllUsersDeps,
): Promise<User[]> => {
  const { page, pageSize, search } = input;
  return deps.userRepository.findAllPaginated({ page, pageSize, search });
};
