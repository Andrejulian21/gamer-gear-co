import { describe, it, expect } from 'vitest';
import { updateAddress } from '../UpdateAddress';
import { createMockAddressRepository } from '@/domain/__tests__/mocks';
import { AddressNotFoundError, AddressNotOwnedError } from '@/domain/errors/AddressErrors';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address } from '@/domain/entities/Address';

const makeDeps = (overrides: { addressRepository?: AddressRepository } = {}) => ({
  addressRepository: overrides.addressRepository ?? createMockAddressRepository(),
});

const makeAddress = (overrides: Partial<Address> = {}): Address => ({
  id: 'addr-1',
  userId: 'user-1',
  street: '123 Main St',
  city: 'Bogotá',
  state: 'Cundinamarca',
  zipCode: '110111',
  phone: '+57 300 123 4567',
  isDefault: false,
  ...overrides,
});

describe('updateAddress', () => {
  it('updates an address owned by the user', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-1' }));

    const updated = await updateAddress(
      {
        addressId: 'addr-1',
        userId: 'user-1',
        data: { street: '456 Other Ave', city: 'Medellín' },
      },
      makeDeps({ addressRepository }),
    );

    expect(updated.street).toBe('456 Other Ave');
    expect(updated.city).toBe('Medellín');
    // Unchanged fields are preserved.
    expect(updated.zipCode).toBe('110111');
    expect(updated.userId).toBe('user-1');
  });

  it('toggles isDefault', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(
      makeAddress({ id: 'addr-1', userId: 'user-1', isDefault: false }),
    );

    const updated = await updateAddress(
      { addressId: 'addr-1', userId: 'user-1', data: { isDefault: true } },
      makeDeps({ addressRepository }),
    );

    expect(updated.isDefault).toBe(true);
  });

  it('throws AddressNotFoundError when the address does not exist', async () => {
    const deps = makeDeps();
    await expect(
      updateAddress({ addressId: 'missing', userId: 'user-1', data: { street: 'X' } }, deps),
    ).rejects.toBeInstanceOf(AddressNotFoundError);
  });

  it('throws AddressNotOwnedError when the user is not the owner', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-2' }));

    await expect(
      updateAddress(
        { addressId: 'addr-1', userId: 'user-1', data: { street: 'X' } },
        makeDeps({ addressRepository }),
      ),
    ).rejects.toBeInstanceOf(AddressNotOwnedError);
  });
});
