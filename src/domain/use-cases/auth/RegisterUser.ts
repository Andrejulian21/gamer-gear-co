import { z } from 'zod';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User } from '@/domain/entities/User';

export const RegisterUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name must not be empty'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

export type PasswordHasher = (plainPassword: string) => Promise<string>;

export interface RegisterUserDeps {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
}

export class RegisterUserError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'EMAIL_TAKEN'
      | 'WEAK_PASSWORD'
      | 'INVALID_EMAIL'
      | 'INVALID_NAME'
      | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'RegisterUserError';
  }
}

export const registerUser = async (
  input: RegisterUserInput,
  deps: RegisterUserDeps,
): Promise<User> => {
  const parsed = RegisterUserInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.path[0] === 'password') {
      throw new RegisterUserError(first.message, 'WEAK_PASSWORD');
    }
    if (first?.path[0] === 'email') {
      throw new RegisterUserError(first.message, 'INVALID_EMAIL');
    }
    if (first?.path[0] === 'name') {
      throw new RegisterUserError(first.message, 'INVALID_NAME');
    }
    throw new RegisterUserError(first?.message ?? 'Invalid input', 'UNKNOWN');
  }

  const { email, name, password, role } = parsed.data;

  const existing = await deps.userRepository.findByEmail(email);
  if (existing) {
    throw new RegisterUserError(`User with email ${email} already exists`, 'EMAIL_TAKEN');
  }

  const hashedPassword = await deps.passwordHasher(password);

  return deps.userRepository.create({
    email,
    name,
    hashedPassword,
    role: role ?? 'USER',
  });
};
