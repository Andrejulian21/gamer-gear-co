import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';

export type PasswordComparer = (plainPassword: string, hashedPassword: string) => Promise<boolean>;

export interface PasswordHasher {
  hash: (plainPassword: string) => Promise<string>;
  compare: PasswordComparer;
}

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export const authenticateUser = async (
  input: AuthenticateUserInput,
  deps: AuthenticateUserDeps,
): Promise<User> => {
  const user = await deps.userRepository.findByEmail(input.email);
  if (!user) {
    // Avoid leaking whether the email exists: do not call compare.
    throw new InvalidCredentialsError();
  }

  const matches = await deps.passwordHasher.compare(input.password, user.hashedPassword);
  if (!matches) {
    throw new InvalidCredentialsError();
  }

  return user;
};
