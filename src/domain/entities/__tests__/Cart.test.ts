import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  createCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clear,
  calculateSubtotal,
  getTotalItems,
  toCartItems,
} from '../Cart';
import { InvalidCartItemQuantityError, CartItemNotFoundError } from '../../errors/CartErrors';

describe('Cart aggregate', () => {
  describe('createCart', () => {
    it('builds an empty cart from a userId', () => {
      const cart = createCart({ userId: 'user-1' });
      expect(cart.userId).toBe('user-1');
      expect(cart.items).toEqual([]);
    });

    it('builds a cart with initial items', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ],
      });
      expect(cart.items).toHaveLength(2);
    });

    it('merges duplicate productIds in initial items (sums quantities)', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-1', quantity: 3 },
        ],
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('rejects negative quantity in initial items', () => {
      expect(() =>
        createCart({ userId: 'user-1', items: [{ productId: 'p-1', quantity: -1 }] }),
      ).toThrow(InvalidCartItemQuantityError);
    });

    it('rejects empty userId', () => {
      expect(() => createCart({ userId: '' })).toThrow();
    });
  });

  describe('addItem', () => {
    it('appends a new item to the cart', () => {
      const cart = createCart({ userId: 'user-1' });
      const next = addItem(cart, 'p-1', 2);
      expect(next.items).toEqual([{ productId: 'p-1', quantity: 2 }]);
    });

    it('sums quantities when the product already exists', () => {
      const cart = createCart({ userId: 'user-1', items: [{ productId: 'p-1', quantity: 2 }] });
      const next = addItem(cart, 'p-1', 3);
      expect(next.items[0].quantity).toBe(5);
    });

    it('returns a new Cart (immutability)', () => {
      const cart = createCart({ userId: 'user-1' });
      const next = addItem(cart, 'p-1', 2);
      expect(next).not.toBe(cart);
      expect(cart.items).toEqual([]);
    });

    it('rejects quantity <= 0', () => {
      const cart = createCart({ userId: 'user-1' });
      expect(() => addItem(cart, 'p-1', 0)).toThrow(InvalidCartItemQuantityError);
      expect(() => addItem(cart, 'p-1', -1)).toThrow(InvalidCartItemQuantityError);
    });
  });

  describe('updateItemQuantity', () => {
    it('replaces the quantity of an existing item', () => {
      const cart = createCart({ userId: 'user-1', items: [{ productId: 'p-1', quantity: 2 }] });
      const next = updateItemQuantity(cart, 'p-1', 5);
      expect(next.items[0].quantity).toBe(5);
    });

    it('removes the item when quantity is 0', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 1 },
        ],
      });
      const next = updateItemQuantity(cart, 'p-1', 0);
      expect(next.items).toHaveLength(1);
      expect(next.items[0].productId).toBe('p-2');
    });

    it('throws CartItemNotFoundError when the product is not in the cart', () => {
      const cart = createCart({ userId: 'user-1' });
      expect(() => updateItemQuantity(cart, 'missing', 1)).toThrow(CartItemNotFoundError);
    });

    it('rejects negative quantity', () => {
      const cart = createCart({ userId: 'user-1', items: [{ productId: 'p-1', quantity: 2 }] });
      expect(() => updateItemQuantity(cart, 'p-1', -1)).toThrow(InvalidCartItemQuantityError);
    });
  });

  describe('removeItem', () => {
    it('removes the item by productId', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 1 },
        ],
      });
      const next = removeItem(cart, 'p-1');
      expect(next.items).toEqual([{ productId: 'p-2', quantity: 1 }]);
    });

    it('is a no-op when the product is not in the cart', () => {
      const cart = createCart({ userId: 'user-1', items: [{ productId: 'p-1', quantity: 2 }] });
      const next = removeItem(cart, 'missing');
      expect(next.items).toEqual([{ productId: 'p-1', quantity: 2 }]);
    });
  });

  describe('clear', () => {
    it('empties the cart', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 1 },
        ],
      });
      const next = clear(cart);
      expect(next.items).toEqual([]);
    });
  });

  describe('getTotalItems', () => {
    it('sums all quantities', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
          { productId: 'p-3', quantity: 1 },
        ],
      });
      expect(getTotalItems(cart)).toBe(6);
    });

    it('returns 0 for an empty cart', () => {
      const cart = createCart({ userId: 'user-1' });
      expect(getTotalItems(cart)).toBe(0);
    });
  });

  describe('calculateSubtotal', () => {
    it('sums price * quantity for all items', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ],
      });
      const prices = new Map([
        ['p-1', new Decimal(10)],
        ['p-2', new Decimal(20)],
      ]);
      const subtotal = calculateSubtotal(cart, (id) => prices.get(id) ?? null);
      expect(subtotal.toString()).toBe('80');
    });

    it('handles decimal prices with no floating point drift', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [{ productId: 'p-1', quantity: 3 }],
      });
      const prices = new Map([['p-1', new Decimal('19.99')]]);
      const subtotal = calculateSubtotal(cart, (id) => prices.get(id) ?? null);
      expect(subtotal.toString()).toBe('59.97');
    });

    it('skips items whose product has no available price', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ],
      });
      const prices = new Map([['p-1', new Decimal(10)]]);
      const subtotal = calculateSubtotal(cart, (id) => prices.get(id) ?? null);
      expect(subtotal.toString()).toBe('20');
    });

    it('returns 0 for an empty cart', () => {
      const cart = createCart({ userId: 'user-1' });
      const subtotal = calculateSubtotal(cart, () => null);
      expect(subtotal.toString()).toBe('0');
    });
  });

  describe('toCartItems', () => {
    it('flattens the cart into CartItem entities with deterministic ids', () => {
      const cart = createCart({
        userId: 'user-1',
        items: [
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ],
      });
      const items = toCartItems(cart);
      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        id: 'user-1:p-1',
        userId: 'user-1',
        productId: 'p-1',
        quantity: 2,
      });
      expect(items[1]).toMatchObject({
        id: 'user-1:p-2',
        userId: 'user-1',
        productId: 'p-2',
        quantity: 3,
      });
    });
  });
});
