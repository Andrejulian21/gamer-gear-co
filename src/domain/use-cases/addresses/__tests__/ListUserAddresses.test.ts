import { describe, it, expect } from 'vitest';
import { listUserAddresses } from '../ListUserAddresses';
import { createMockAddressRepository } from '@/domain/__tests__/mocks';
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

describe('listUserAddresses', () => {
  it('returns an empty array when the user has no addresses', async () => {
    const addressRepository = createMockAddressRepository();
    const result = await listUserAddresses({ userId: 'user-1' }, makeDeps({ addressRepository }));
    expect(result).toEqual([]);
    expect(addressRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns all addresses belonging to the user', async () => {
    const addressRepository = createMockAddressRepository();
    await addressRepository.create(makeAddress({ id: 'a1', userId: 'user-1' }));
    await addressRepository.create(makeAddress({ id: 'a2', userId: 'user-1' }));
    // A different user's address that must not leak:
    await addressRepository.create(makeAddress({ id: 'a3', userId: 'user-2' }));

    const result = await listUserAddresses({ userId: 'user-1' }, makeDeps({ addressRepository }));
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(['a1', 'a2']);
  });

  it('does not throw when called with an unknown userId (returns empty)', async () => {
    const deps = makeDeps();
    const result = await listUserAddresses({ userId: 'nobody' }, deps);
    expect(result).toEqual([]);
  });
});
