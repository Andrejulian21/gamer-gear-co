import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import { AddressNotFoundError, AddressNotOwnedError } from '@/domain/errors/AddressErrors';

export interface DeleteAddressInput {
  addressId: string;
  userId: string;
}

export interface DeleteAddressDeps {
  addressRepository: AddressRepository;
}

/**
 * Delete an address owned by the calling user.
 *
 * Guards, in order:
 *   1. Existence: AddressNotFoundError if the address is missing.
 *   2. Ownership: AddressNotOwnedError if the address exists but
 *      belongs to a different user. Without this guard, any
 *      signed-in user could delete any address by id.
 *
 * On success, the row is removed and the function returns void.
 */
export const deleteAddress = async (
  input: DeleteAddressInput,
  deps: DeleteAddressDeps,
): Promise<void> => {
  const existing = await deps.addressRepository.findById(input.addressId);
  if (!existing) {
    throw new AddressNotFoundError(input.addressId);
  }
  if (existing.userId !== input.userId) {
    throw new AddressNotOwnedError(input.addressId, input.userId);
  }

  await deps.addressRepository.delete(input.addressId);
};
