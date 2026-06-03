/**
 * Account dependency factory (Phase 6 / Profile).
 *
 * Wires the account + address use cases to their infrastructure
 * (Prisma repositories + bcrypt-backed password hasher). This is the
 * single import path used by every account server action, server
 * component, and route handler that needs to read or mutate a
 * signed-in user's profile, addresses, or password.
 *
 * Mirrors the pattern of `admin-deps.ts`: the returned use case
 * functions are pre-wired with their dependencies; callers only pass
 * the domain input. The bcrypt wrapper is imported from
 * `@/infrastructure/auth/password-hasher` so this file stays
 * framework-agnostic and testable.
 *
 *     const { updateProfile, addAddress } = getAccountDeps();
 *     await updateProfile({ userId, name });
 *     await addAddress({ userId, street, city, ... });
 */

import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaAddressRepository } from '@/infrastructure/repositories/PrismaAddressRepository';
import { bcryptPasswordHasher } from '@/infrastructure/auth/password-hasher';

import { addAddress as addAddressUseCase } from '@/domain/use-cases/addresses/AddAddress';
import { listUserAddresses as listUserAddressesUseCase } from '@/domain/use-cases/addresses/ListUserAddresses';
import { updateAddress as updateAddressUseCase } from '@/domain/use-cases/addresses/UpdateAddress';
import { deleteAddress as deleteAddressUseCase } from '@/domain/use-cases/addresses/DeleteAddress';
import { setDefaultAddress as setDefaultAddressUseCase } from '@/domain/use-cases/addresses/SetDefaultAddress';
import { updateProfile as updateProfileUseCase } from '@/domain/use-cases/account/UpdateProfile';
import { changePassword as changePasswordUseCase } from '@/domain/use-cases/account/ChangePassword';

import type { AddAddressInput } from '@/domain/use-cases/addresses/AddAddress';
import type { ListUserAddressesInput } from '@/domain/use-cases/addresses/ListUserAddresses';
import type { UpdateAddressInput } from '@/domain/use-cases/addresses/UpdateAddress';
import type { DeleteAddressInput } from '@/domain/use-cases/addresses/DeleteAddress';
import type { SetDefaultAddressInput } from '@/domain/use-cases/addresses/SetDefaultAddress';
import type { UpdateProfileInput } from '@/domain/use-cases/account/UpdateProfile';
import type { ChangePasswordInput } from '@/domain/use-cases/account/ChangePassword';

import type { Address } from '@/domain/entities/Address';
import type { User } from '@/domain/entities/User';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { PasswordHasher } from '@/domain/use-cases/auth/AuthenticateUser';

export interface AccountDeps {
  // Repositories (exposed for actions that need to bypass use cases)
  userRepository: UserRepository;
  addressRepository: AddressRepository;
  passwordHasher: PasswordHasher;

  // Address use cases
  addAddress: (input: AddAddressInput) => Promise<Address>;
  listUserAddresses: (input: ListUserAddressesInput) => Promise<Address[]>;
  updateAddress: (input: UpdateAddressInput) => Promise<Address>;
  deleteAddress: (input: DeleteAddressInput) => Promise<void>;
  setDefaultAddress: (input: SetDefaultAddressInput) => Promise<Address>;

  // Account use cases
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
}

/**
 * Build a fully-wired set of account dependencies. Safe to call
 * multiple times per request — repositories are cheap to instantiate
 * and the underlying PrismaClient is a global singleton.
 */
export function getAccountDeps(): AccountDeps {
  const userRepository = new PrismaUserRepository();
  const addressRepository = new PrismaAddressRepository();
  const passwordHasher = bcryptPasswordHasher;

  return {
    userRepository,
    addressRepository,
    passwordHasher,

    // Addresses
    addAddress: (input) => addAddressUseCase(input, { addressRepository }),
    listUserAddresses: (input) => listUserAddressesUseCase(input, { addressRepository }),
    updateAddress: (input) => updateAddressUseCase(input, { addressRepository }),
    deleteAddress: (input) => deleteAddressUseCase(input, { addressRepository }),
    setDefaultAddress: (input) => setDefaultAddressUseCase(input, { addressRepository }),

    // Account
    updateProfile: (input) => updateProfileUseCase(input, { userRepository }),
    changePassword: (input) => changePasswordUseCase(input, { userRepository, passwordHasher }),
  };
}
