import { describe, it, expect } from 'vitest';
import { setDefaultAddress } from '../SetDefaultAddress';
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

describe('setDefaultAddress', () => {
  it('marks the chosen address as default and returns it', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-1' }));
    await addressRepository.create(makeAddress({ id: 'addr-2', userId: 'user-1' }));

    const updated = await setDefaultAddress(
      { addressId: 'addr-2', userId: 'user-1' },
      makeDeps({ addressRepository }),
    );

    expect(updated.id).toBe('addr-2');
    expect(updated.isDefault).toBe(true);
    expect(addressRepository.setDefault).toHaveBeenCalledWith('user-1', 'addr-2');
  });

  it('throws AddressNotFoundError when the address does not exist', async () => {
    const deps = makeDeps();
    await expect(
      setDefaultAddress({ addressId: 'missing', userId: 'user-1' }, deps),
    ).rejects.toBeInstanceOf(AddressNotFoundError);
  });

  it('throws AddressNotOwnedError when the user does not own the address', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-2' }));

    await expect(
      setDefaultAddress({ addressId: 'addr-1', userId: 'user-1' }, makeDeps({ addressRepository })),
    ).rejects.toBeInstanceOf(AddressNotOwnedError);
  });

  it('does NOT call setDefault when the ownership check fails', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'addr-1', userId: 'user-2' }));

    await expect(
      setDefaultAddress({ addressId: 'addr-1', userId: 'user-1' }, makeDeps({ addressRepository })),
    ).rejects.toBeInstanceOf(AddressNotOwnedError);
    expect(addressRepository.setDefault).not.toHaveBeenCalled();
  });
});
