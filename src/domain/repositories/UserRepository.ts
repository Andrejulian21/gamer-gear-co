import { User, CreateUserInput } from '../entities/User';

export interface UserListFilters {
  page: number;
  pageSize: number;
  search?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<CreateUserInput>): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  /**
   * Paginated user listing for the admin UI. The repository is
   * responsible for the WHERE search filter (matches name OR email,
   * case-insensitive) and the ORDER BY createdAt DESC. The caller
   * is responsible for validating `page >= 1` and `pageSize > 0`.
   */
  findAllPaginated(filters: UserListFilters): Promise<User[]>;
  countAll(): Promise<number>;
  countByRole(role: 'USER' | 'ADMIN'): Promise<number>;
}
