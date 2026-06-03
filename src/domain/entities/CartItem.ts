import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CreateCartItemSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export type CreateCartItemInput = z.infer<typeof CreateCartItemSchema>;

export const createCartItem = (input: CreateCartItemInput & { id?: string }): CartItem => {
  const validated = CreateCartItemSchema.parse(input);

  return CartItemSchema.parse({
    id: input.id ?? crypto.randomUUID(),
    userId: validated.userId,
    productId: validated.productId,
    quantity: validated.quantity,
  });
};
