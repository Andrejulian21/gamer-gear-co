import { Address, CreateAddressInput } from '../entities/Address';

export interface AddressRepository {
  findById(id: string): Promise<Address | null>;
  findByUserId(userId: string): Promise<Address[]>;
  create(addressData: CreateAddressInput): Promise<Address>;
  update(id: string, data: Partial<CreateAddressInput>): Promise<Address>;
  delete(id: string): Promise<void>;
  setDefault(userId: string, addressId: string): Promise<Address>;
}
