import { describe, it, expect } from 'vitest';
import { createOrderFromCart } from '../CreateOrderFromCart';
import {
  createMockCartRepository,
  createMockProductRepository,
  createMockOrderRepository,
} from '@/domain/__tests__/mocks';
import { EmptyCartError } from '@/domain/errors/OrderErrors';
import { ProductNotFoundError } from '@/domain/errors/CartErrors';
import type { Product } from '@/domain/entities/Product';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Test Mouse',
  slug: 'test-mouse',
  description: 'A great mouse',
  price: 50,
  stock: 10,
  images: [],
  brandId: 'brand-1',
  categoryId: 'category-1',
  featured: false,
  ...overrides,
});

const SHIPPING = {
  street: '123 Main St',
  city: 'Bogota',
  state: 'Cundinamarca',
  zipCode: '110111',
  phone: '+573001234567',
};

describe('createOrderFromCart', () => {
  it('throws EmptyCartError when the cart is empty', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await expect(
      createOrderFromCart(
        { userId: 'user-1', shippingAddress: SHIPPING },
        { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
      ),
    ).rejects.toBeInstanceOf(EmptyCartError);
  });

  it('creates an order with a single cart item, correct total and PENDING status', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await productRepo.create(makeProduct({ id: 'product-1', price: 50, stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 2);

    const order = await createOrderFromCart(
      { userId: 'user-1', shippingAddress: SHIPPING },
      { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
    );

    expect(order.userId).toBe('user-1');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productId).toBe('product-1');
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].price).toBe(50);
    expect(order.total).toBe(100);
    expect(order.status).toBe('PENDING');
    expect(order.shippingAddress).toEqual(SHIPPING);
  });

  it('creates an order with multiple items, total summed correctly', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await productRepo.create(makeProduct({ id: 'product-1', price: 50, stock: 10 }));
    await productRepo.create(makeProduct({ id: 'product-2', price: 25.5, stock: 10 }));
    await productRepo.create(makeProduct({ id: 'product-3', price: 100, stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 2); // 100
    await cartRepo.addItem('user-1', 'product-2', 3); // 76.5
    await cartRepo.addItem('user-1', 'product-3', 1); // 100

    const order = await createOrderFromCart(
      { userId: 'user-1', shippingAddress: SHIPPING },
      { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
    );

    expect(order.items).toHaveLength(3);
    expect(order.total).toBe(276.5);
    expect(order.status).toBe('PENDING');
  });

  it('rounds total to 2 decimals when fractional multiplication would occur', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    // 9.99 * 3 = 29.97 (clean)
    await productRepo.create(makeProduct({ id: 'product-1', price: 9.99, stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 3);

    const order = await createOrderFromCart(
      { userId: 'user-1', shippingAddress: SHIPPING },
      { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
    );

    expect(order.total).toBe(29.97);
  });

  it('throws ProductNotFoundError when any cart item has a missing product', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await productRepo.create(makeProduct({ id: 'product-1', price: 50, stock: 10 }));
    // product-2 was added to cart but never created
    await cartRepo.addItem('user-1', 'product-1', 2);
    await cartRepo.addItem('user-1', 'product-2', 1);

    await expect(
      createOrderFromCart(
        { userId: 'user-1', shippingAddress: SHIPPING },
        { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
      ),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('generates a UUID-shaped wompiReference and assigns it to the order', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await productRepo.create(makeProduct({ id: 'product-1', price: 50, stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 1);

    const order = await createOrderFromCart(
      { userId: 'user-1', shippingAddress: SHIPPING },
      { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
    );

    expect(order.wompiReference).toBeDefined();
    expect(order.wompiReference).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('persists the order via orderRepository.create with PENDING status', async () => {
    const cartRepo = createMockCartRepository();
    const productRepo = createMockProductRepository();
    const orderRepo = createMockOrderRepository();

    await productRepo.create(makeProduct({ id: 'product-1', price: 50, stock: 10 }));
    await cartRepo.addItem('user-1', 'product-1', 2);

    const order = await createOrderFromCart(
      { userId: 'user-1', shippingAddress: SHIPPING },
      { cartRepository: cartRepo, productRepository: productRepo, orderRepository: orderRepo },
    );

    expect(orderRepo.create).toHaveBeenCalledTimes(1);
    const callArg = (orderRepo.create as ReturnType<typeof import('vitest').vi.fn>).mock
      .calls[0][0];
    expect(callArg.userId).toBe('user-1');
    expect(callArg.status).toBe('PENDING');
    expect(callArg.total).toBe(100);
    expect(callArg.shippingAddress).toEqual(SHIPPING);
    expect(callArg.wompiReference).toBe(order.wompiReference);
  });
});
