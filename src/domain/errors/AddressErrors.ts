/**
 * Domain-level errors for the Address aggregate (Phase 6 / Profile).
 *
 * Framework-agnostic — no Prisma, Next, NextAuth, or bcryptjs imports.
 * Use cases throw these to signal address-specific rule violations; the
 * presentation layer maps them to HTTP/UI responses.
 */

/**
 * Thrown by address use cases when the target address does not exist.
 * Sits alongside `UserNotFoundError` (from AdminErrors) and the
 * general "not found" used by other aggregates.
 */
export class AddressNotFoundError extends Error {
  constructor(public readonly addressId: string) {
    super(`Address with id "${addressId}" not found`);
    this.name = 'AddressNotFoundError';
  }
}

/**
 * Thrown by address use cases when the calling user is not the owner
 * of the target address. Prevents IDOR-style cross-user tampering
 * (e.g. user A editing user B's address by guessing the addressId).
 */
export class AddressNotOwnedError extends Error {
  constructor(
    public readonly addressId: string,
    public readonly userId: string,
  ) {
    super(`Address "${addressId}" is not owned by user "${userId}"`);
    this.name = 'AddressNotOwnedError';
  }
}
