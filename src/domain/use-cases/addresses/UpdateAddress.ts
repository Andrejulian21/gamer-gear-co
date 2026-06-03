import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address, CreateAddressInput } from '@/domain/entities/Address';
import { AddressNotFoundError, AddressNotOwnedError } from '@/domain/errors/AddressErrors';

export interface UpdateAddressInput {
  addressId: string;
  userId: string;
  data: Partial<CreateAddressInput>;
}

export interface UpdateAddressDeps {
  addressRepository: AddressRepository;
}

/**
 * Update one of a user's addresses.
 *
 * Guards, in order:
 *   1. Existence: if the address cannot be found, throw
 *      AddressNotFoundError.
 *   2. Ownership: if the existing address's userId does not match
 *      the calling user, throw AddressNotOwnedError. This is the
 *      IDOR guard — without it, any signed-in user could edit any
 *      address by guessing the id.
 *
 * The `data` partial is forwarded as-is to the repository, which
 * filters out undefined fields and applies the changes.
 */
export const updateAddress = async (
  input: UpdateAddressInput,
  deps: UpdateAddressDeps,
): Promise<Address> => {
  const existing = await deps.addressRepository.findById(input.addressId);
  if (!existing) {
    throw new AddressNotFoundError(input.addressId);
  }
  if (existing.userId !== input.userId) {
    throw new AddressNotOwnedError(input.addressId, input.userId);
  }

  return deps.addressRepository.update(input.addressId, input.data);
};
