import { describe, it, expect } from 'vitest';
import { addAddress } from '../AddAddress';
import { createMockAddressRepository } from '@/domain/__tests__/mocks';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';

const makeDeps = (overrides: { addressRepository?: AddressRepository } = {}) => ({
  addressRepository: overrides.addressRepository ?? createMockAddressRepository(),
});

const validInput = {
  userId: 'user-1',
  street: '123 Main St',
  city: 'Bogotá',
  state: 'Cundinamarca',
  zipCode: '110111',
  phone: '+57 300 123 4567',
  isDefault: false,
};

describe('addAddress', () => {
  it('creates an address and returns it', async () => {
    const addressRepository = createMockAddressRepository();
    const address = await addAddress(validInput, makeDeps({ addressRepository }));

    expect(address.id).toBeDefined();
    expect(address.userId).toBe('user-1');
    expect(address.street).toBe('123 Main St');
    expect(address.city).toBe('Bogotá');
    expect(address.isDefault).toBe(false);
    expect(addressRepository.create).toHaveBeenCalledWith(validInput);
  });

  it('persists with isDefault=true when the caller asks for it', async () => {
    const addressRepository = createMockAddressRepository();
    const address = await addAddress(
      { ...validInput, isDefault: true },
      makeDeps({ addressRepository }),
    );
    expect(address.isDefault).toBe(true);
  });

  it('throws when street is empty', async () => {
    const deps = makeDeps();
    await expect(addAddress({ ...validInput, street: '' }, deps)).rejects.toThrow();
  });

  it('throws when userId is missing', async () => {
    const deps = makeDeps();
    await expect(addAddress({ ...validInput, userId: '' }, deps)).rejects.toThrow();
  });
});
