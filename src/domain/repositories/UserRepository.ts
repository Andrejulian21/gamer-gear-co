import { User, CreateUserInput } from '../entities/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<CreateUserInput>): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}
