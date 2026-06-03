import { OrderStatusBadge } from '@/app/(shop)/orders/_components/OrderStatusBadge';

/**
 * Re-export of the shop's OrderStatusBadge so admin pages have a
 * single import path that signals "I want the admin-flavored status
 * indicator" without dragging the shop's path into admin pages.
 *
 * The colors and label mapping live in the shop component; we mirror
 * it here to keep them in sync. If a status ever diverges between
 * shop and admin (e.g. internal-only statuses), fork this file.
 */
export { OrderStatusBadge as StatusBadge };
