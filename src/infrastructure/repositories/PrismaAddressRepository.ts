import { prisma } from '../db/prisma';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address, CreateAddressInput } from '@/domain/entities/Address';
import { Prisma } from '@prisma/client';

const toDomain = (a: {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
}): Address => ({
  id: a.id,
  userId: a.userId,
  street: a.street,
  city: a.city,
  state: a.state,
  zipCode: a.zipCode,
  phone: a.phone,
  isDefault: a.isDefault,
  createdAt: a.createdAt,
});

export class PrismaAddressRepository implements AddressRepository {
  async findById(id: string): Promise<Address | null> {
    const address = await prisma.address.findUnique({ where: { id } });
    return address ? toDomain(address) : null;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map(toDomain);
  }

  async create(addressData: CreateAddressInput): Promise<Address> {
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: addressData.userId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: {
        userId: addressData.userId,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        phone: addressData.phone,
        isDefault: addressData.isDefault ?? false,
      },
    });
    return toDomain(address);
  }

  async update(id: string, data: Partial<CreateAddressInput>): Promise<Address> {
    const updateData: Prisma.AddressUpdateInput = {};
    if (data.userId !== undefined) updateData.user = { connect: { id: data.userId } };
    if (data.street !== undefined) updateData.street = data.street;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const address = await prisma.address.update({ where: { id }, data: updateData });
    return toDomain(address);
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({ where: { id } });
  }

  async setDefault(userId: string, addressId: string): Promise<Address> {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new Error(`Address ${addressId} not found`);
    return toDomain(address);
  }
}
