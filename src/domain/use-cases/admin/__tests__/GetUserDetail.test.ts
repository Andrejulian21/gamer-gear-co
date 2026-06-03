import { describe, it, expect } from 'vitest';
import { getUserDetail } from '../GetUserDetail';
import {
  createMockUserRepository,
  createMockOrderRepository,
  createMockAddressRepository,
} from '@/domain/__tests__/mocks';
import { UserNotFoundError } from '@/domain/errors/AdminErrors';
import type { User } from '@/domain/entities/User';
import type { Order } from '@/domain/entities/Order';
import type { Address } from '@/domain/entities/Address';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'u1@example.com',
  name: 'Alice',
  hashedPassword: 'hashed',
  role: 'USER',
  ...overrides,
});

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  userId: 'user-1',
  items: [{ productId: 'p1', quantity: 1, price: 25 }],
  total: 25,
  status: 'PAID',
  wompiReference: 'r1',
  shippingAddress: {
    street: '123 Main St',
    city: 'Bogota',
    state: 'Cundinamarca',
    zipCode: '110111',
    phone: '+573001234567',
  },
  ...overrides,
});

const makeAddress = (overrides: Partial<Address> = {}): Address => ({
  id: 'addr-1',
  userId: 'user-1',
  street: '123 Main St',
  city: 'Bogota',
  state: 'Cundinamarca',
  zipCode: '110111',
  phone: '+573001234567',
  isDefault: true,
  ...overrides,
});

describe('getUserDetail (admin)', () => {
  it('returns the user plus their orders and addresses', async () => {
    const userRepo = createMockUserRepository();
    const orderRepo = createMockOrderRepository();
    const addressRepo = createMockAddressRepository();

    const user = await userRepo.create(makeUser());
    await orderRepo.create(makeOrder({ userId: user.id }));
    await addressRepo.create(makeAddress({ userId: user.id }));

    const detail = await getUserDetail(
      { userId: user.id },
      { userRepository: userRepo, orderRepository: orderRepo, addressRepository: addressRepo },
    );

    expect(detail.user.id).toBe(user.id);
    expect(detail.orders).toHaveLength(1);
    expect(detail.addresses).toHaveLength(1);
  });

  it('returns empty arrays when the user has no orders or addresses', async () => {
    const userRepo = createMockUserRepository();
    const orderRepo = createMockOrderRepository();
    const addressRepo = createMockAddressRepository();
    const user = await userRepo.create(makeUser());

    const detail = await getUserDetail(
      { userId: user.id },
      { userRepository: userRepo, orderRepository: orderRepo, addressRepository: addressRepo },
    );

    expect(detail.orders).toEqual([]);
    expect(detail.addresses).toEqual([]);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    const userRepo = createMockUserRepository();
    const orderRepo = createMockOrderRepository();
    const addressRepo = createMockAddressRepository();

    await expect(
      getUserDetail(
        { userId: 'missing' },
        { userRepository: userRepo, orderRepository: orderRepo, addressRepository: addressRepo },
      ),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
