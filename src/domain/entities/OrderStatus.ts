import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
]);

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
