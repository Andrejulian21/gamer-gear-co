import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  price: z.number().nonnegative('Price must be a non-negative number'),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  price: z.number().nonnegative('Price must be a non-negative number'),
});

export type CreateOrderItemInput = z.infer<typeof CreateOrderItemSchema>;

export const createOrderItem = (input: CreateOrderItemInput & { id?: string }): OrderItem => {
  const validated = CreateOrderItemSchema.parse(input);

  return OrderItemSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    productId: validated.productId,
    quantity: validated.quantity,
    price: validated.price,
  });
};
