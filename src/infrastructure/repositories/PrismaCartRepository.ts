import { prisma } from '../db/prisma';
import type { CartRepository } from '@/domain/repositories/CartRepository';
import type { CartItem } from '@/domain/entities/CartItem';

const toDomain = (c: {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
}): CartItem => ({
  id: c.id,
  userId: c.userId,
  productId: c.productId,
  quantity: c.quantity,
});

export class PrismaCartRepository implements CartRepository {
  async findByUserId(userId: string): Promise<CartItem[]> {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    return items.map(toDomain);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return toDomain(updated);
    }

    const created = await prisma.cartItem.create({
      data: { userId, productId, quantity },
    });
    return toDomain(created);
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const updated = await prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
    });
    return toDomain(updated);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    await prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clear(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
}
