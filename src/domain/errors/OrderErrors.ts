/**
 * Domain-level errors for the Order aggregate.
 *
 * Framework-agnostic — no Prisma, Next, NextAuth, or bcryptjs imports.
 * Use cases throw these to signal domain rule violations; the
 * presentation layer maps them to HTTP/UI responses.
 */

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order with id "${orderId}" not found`);
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidOrderStateTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid order state transition: ${from} -> ${to}`);
    this.name = 'InvalidOrderStateTransitionError';
  }
}

export class EmptyCartError extends Error {
  constructor(public readonly userId: string) {
    super(`Cart for user "${userId}" is empty — cannot create an order`);
    this.name = 'EmptyCartError';
  }
}
