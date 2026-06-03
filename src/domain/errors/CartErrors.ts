/**
 * Domain-level errors for the Cart aggregate.
 *
 * These errors are framework-agnostic and do NOT import from
 * @prisma/client, next, next-auth, or bcryptjs.
 *
 * Use cases throw these to signal domain rule violations. The
 * presentation layer maps them to HTTP/UI responses.
 */

export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product with id "${productId}" not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient stock for product "${productId}": requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class InvalidCartItemQuantityError extends Error {
  constructor(public readonly quantity: number) {
    super(`Invalid cart item quantity: ${quantity}. Must be a positive integer`);
    this.name = 'InvalidCartItemQuantityError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Cart item for product "${productId}" not found`);
    this.name = 'CartItemNotFoundError';
  }
}
