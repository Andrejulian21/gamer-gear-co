import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { AddressRepository } from '@/domain/repositories/AddressRepository';
import type { User } from '@/domain/entities/User';
import type { Order } from '@/domain/entities/Order';
import type { Address } from '@/domain/entities/Address';
import { UserNotFoundError } from '@/domain/errors/AdminErrors';

export interface GetUserDetailInput {
  userId: string;
}

export interface UserDetail {
  user: User;
  orders: Order[];
  addresses: Address[];
}

export interface GetUserDetailDeps {
  userRepository: UserRepository;
  orderRepository: OrderRepository;
  addressRepository: AddressRepository;
}

/**
 * Admin use case: fetch a user's full profile — the user record, all
 * their orders, and all their addresses. The three repositories are
 * queried sequentially (not Promise.all) so that:
 *   1. We can fail fast on a missing user without doing extra I/O
 *   2. We can return a stable shape even if the order/address
 *      repositories throw (those failures are not fatal for a
 *      user-detail view — but for now we let them propagate, since
 *      they signal a real DB issue).
 */
export const getUserDetail = async (
  input: GetUserDetailInput,
  deps: GetUserDetailDeps,
): Promise<UserDetail> => {
  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    throw new UserNotFoundError(input.userId);
  }

  const orders = await deps.orderRepository.findByUserId(input.userId);
  const addresses = await deps.addressRepository.findByUserId(input.userId);

  return { user, orders, addresses };
};
