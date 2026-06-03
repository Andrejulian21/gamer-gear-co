import { describe, it, expect } from 'vitest';
import { deleteAddress } from '../DeleteAddress';
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

describe('deleteAddress', () => {
  it('deletes the address and returns void', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-1' }));

    const result = await deleteAddress(
      { addressId: 'addr-1', userId: 'user-1' },
      makeDeps({ addressRepository }),
    );

    expect(result).toBeUndefined();
    expect(addressRepository.delete).toHaveBeenCalledWith('addr-1');
    // Confirm the address is gone.
    expect(await addressRepository.findById('addr-1')).toBeNull();
  });

  it('throws AddressNotFoundError when the address does not exist', async () => {
    const deps = makeDeps();
    await expect(
      deleteAddress({ addressId: 'missing', userId: 'user-1' }, deps),
    ).rejects.toBeInstanceOf(AddressNotFoundError);
  });

  it('throws AddressNotOwnedError when the user is not the owner', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-2' }));

    await expect(
      deleteAddress({ addressId: 'addr-1', userId: 'user-1' }, makeDeps({ addressRepository })),
    ).rejects.toBeInstanceOf(AddressNotOwnedError);
  });

  it('does NOT call delete when the ownership check fails', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-2' }));

    await expect(
      deleteAddress({ addressId: 'addr-1', userId: 'user-1' }, makeDeps({ addressRepository })),
    ).rejects.toBeInstanceOf(AddressNotOwnedError);
    expect(addressRepository.delete).not.toHaveBeenCalled();
  });
});
