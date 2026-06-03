import { CreateAddressSchema } from '@/domain/entities/Address';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { Address, CreateAddressInput } from '@/domain/entities/Address';

export type AddAddressInput = CreateAddressInput;

export interface AddAddressDeps {
  addressRepository: AddressRepository;
}

/**
 * Add a new address to a user's profile.
 *
 * Validates the payload via `CreateAddressSchema` (the same Zod schema
 * the entity factory uses) so the use case fails fast on empty
 * fields — independent of the repository implementation in use
 * (mocks, in-memory, or Prisma).
 */
export const addAddress = async (
  input: AddAddressInput,
  deps: AddAddressDeps,
): Promise<Address> => {
  const parsed = CreateAddressSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid address input');
  }
  return deps.addressRepository.create(parsed.data);
};
