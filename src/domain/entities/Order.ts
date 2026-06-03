import { z } from 'zod';
import { OrderStatusSchema } from './OrderStatus';

const SHIPPING_ADDRESS_SCHEMA = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
});

const ORDER_ITEM_INPUT_SCHEMA = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(ORDER_ITEM_INPUT_SCHEMA).min(1, 'Order must contain at least one item'),
  total: z.number().nonnegative(),
  status: OrderStatusSchema.default('PENDING'),
  wompiReference: z.string().nullable().optional(),
  shippingAddress: SHIPPING_ADDRESS_SCHEMA,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(ORDER_ITEM_INPUT_SCHEMA).min(1, 'Order must contain at least one item'),
  total: z.number().nonnegative('Total must be a non-negative number'),
  shippingAddress: SHIPPING_ADDRESS_SCHEMA,
  status: OrderStatusSchema.optional().default('PENDING'),
  wompiReference: z.string().nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const createOrder = (
  input: CreateOrderInput & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  },
): Order => {
  const validated = CreateOrderSchema.parse(input);

  const computedTotal = round2(
    validated.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  if (round2(validated.total) !== computedTotal) {
    throw new Error(`Order total mismatch: expected ${computedTotal}, got ${validated.total}`);
  }

  return OrderSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    userId: validated.userId,
    items: validated.items,
    total: validated.total,
    status: validated.status,
    wompiReference: validated.wompiReference,
    shippingAddress: validated.shippingAddress,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
};
