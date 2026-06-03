import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address } from '@/domain/entities/Address';
import { AddressNotFoundError, AddressNotOwnedError } from '@/domain/errors/AddressErrors';

export interface SetDefaultAddressInput {
  addressId: string;
  userId: string;
}

export interface SetDefaultAddressDeps {
  addressRepository: AddressRepository;
}

/**
 * Mark an address as the user's default.
 *
 * Same IDOR guard as `updateAddress` / `deleteAddress`:
 *   1. Existence check via findById.
 *   2. Ownership check.
 *   3. Delegate to `setDefault`, which the Prisma implementation
 *      wraps in a transaction (clear isDefault on all rows for
 *      the user, then set on the chosen id).
 */
export const setDefaultAddress = async (
  input: SetDefaultAddressInput,
  deps: SetDefaultAddressDeps,
): Promise<Address> => {
  const existing = await deps.addressRepository.findById(input.addressId);
  if (!existing) {
    throw new AddressNotFoundError(input.addressId);
  }
  if (existing.userId !== input.userId) {
    throw new AddressNotOwnedError(input.addressId, input.userId);
  }

  return deps.addressRepository.setDefault(input.userId, input.addressId);
};
