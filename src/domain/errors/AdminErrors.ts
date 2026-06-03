/**
 * Domain-level errors for the Admin aggregate.
 *
 * Framework-agnostic — no Prisma, Next, NextAuth, or bcryptjs imports.
 * Use cases throw these to signal admin-specific rule violations; the
 * presentation layer maps them to HTTP/UI responses.
 */

import type { OrderStatus } from '../entities/OrderStatus';

/**
 * Thrown when an admin attempts an order status transition that is not
 * allowed by the lifecycle rules (e.g. PENDING -> SHIPPED, or any
 * transition from a terminal state like DELIVERED).
 */
export class InvalidStatusTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(`Invalid order status transition: ${from} -> ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Thrown when an admin attempts to change their own role. An admin
 * cannot demote themselves — they must hand the role to someone else
 * first or have another admin demote them.
 */
export class CannotDemoteSelfError extends Error {
  constructor() {
    super('Administrators cannot change their own role');
    this.name = 'CannotDemoteSelfError';
  }
}

/**
 * Thrown when demoting an admin would leave the system with zero
 * administrators. The system always needs at least one admin.
 */
export class CannotDemoteLastAdminError extends Error {
  constructor() {
    super('Cannot demote the last administrator in the system');
    this.name = 'CannotDemoteLastAdminError';
  }
}

/**
 * Thrown when an upload is attempted but the Vercel Blob token
 * (BLOB_READ_WRITE_TOKEN) is missing from the environment.
 */
export class UploadNotConfiguredError extends Error {
  constructor() {
    super('Image upload is not configured: BLOB_READ_WRITE_TOKEN environment variable is missing');
    this.name = 'UploadNotConfiguredError';
  }
}

/**
 * Thrown when an upload fails validation (unsupported mime type, file
 * too large, etc.). The `reason` is a short, user-presentable string
 * suitable for display in form error messages.
 */
export class ImageValidationError extends Error {
  constructor(public readonly reason: string) {
    super(`Image validation failed: ${reason}`);
    this.name = 'ImageValidationError';
  }
}

/**
 * Thrown by admin use cases when the target user does not exist.
 * Distinct from any user-facing "not found" so the admin layer can
 * surface richer diagnostics.
 */
export class UserNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`User with id "${userId}" not found`);
    this.name = 'UserNotFoundError';
  }
}
