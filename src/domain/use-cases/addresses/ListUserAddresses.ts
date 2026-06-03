import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address } from '@/domain/entities/Address';

export interface ListUserAddressesInput {
  userId: string;
}

export interface ListUserAddressesDeps {
  addressRepository: AddressRepository;
}

/**
 * List all addresses owned by a user. Repository does the filtering
 * (mock + Prisma both scope to `userId`), so this is a thin pass-through.
 */
export const listUserAddresses = async (
  input: ListUserAddressesInput,
  deps: ListUserAddressesDeps,
): Promise<Address[]> => {
  return deps.addressRepository.findByUserId(input.userId);
};
