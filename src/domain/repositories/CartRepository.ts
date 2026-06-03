import { CartItem } from '../entities/CartItem';

export interface CartRepository {
  findByUserId(userId: string): Promise<CartItem[]>;
  addItem(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem>;
  removeItem(userId: string, productId: string): Promise<void>;
  clear(userId: string): Promise<void>;
}
