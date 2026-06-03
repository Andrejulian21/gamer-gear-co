import { prisma } from '../db/prisma';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { User, CreateUserInput } from '@/domain/entities/User';

const toDomain = (u: {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  hashedPassword: u.password,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? toDomain(user) : null;
  }

  async create(userData: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.hashedPassword,
        role: userData.role,
      },
    });
    return toDomain(user);
  }

  async update(id: string, data: Partial<CreateUserInput>): Promise<User> {
    const updateData: {
      email?: string;
      name?: string;
      password?: string;
      role?: 'USER' | 'ADMIN';
    } = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.hashedPassword !== undefined) updateData.password = data.hashedPassword;
    if (data.role !== undefined) updateData.role = data.role;

    const user = await prisma.user.update({ where: { id }, data: updateData });
    return toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(toDomain);
  }
}
