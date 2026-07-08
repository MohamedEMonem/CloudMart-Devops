/**
 * Unit Tests — Cart Service: cart.service
 *
 * Tests the cart CRUD logic by mocking the Redis client.
 * The cart service is pure Express (not NestJS), so we
 * mock the ioredis module directly.
 */

// ── Mock ioredis before any imports ────────────────────
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('../../../services/cart-service/src/config/redis', () => ({
  redisClient: mockRedisClient,
  CART_TTL_SECONDS: 604800, // 7 days
}));

import * as cartService from '../../../services/cart-service/src/cart/cart.service';

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCart ────────────────────────────────────────────

  describe('getCart', () => {
    it('should return an empty cart when no data exists in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cartService.getCart('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        items: [],
        updatedAt: expect.any(String),
      });
      expect(mockRedisClient.get).toHaveBeenCalledWith('cart:user-1');
    });

    it('should return the parsed cart from Redis', async () => {
      const storedCart = {
        userId: 'user-1',
        items: [{ productId: 'p1', quantity: 2, price: 29.99 }],
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedCart));

      const result = await cartService.getCart('user-1');

      expect(result).toEqual(storedCart);
    });
  });

  // ── addItem ───────────────────────────────────────────

  describe('addItem', () => {
    it('should add a new item to an empty cart', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cartService.addItem('user-1', {
        productId: 'p1',
        quantity: 2,
        price: 29.99,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ productId: 'p1', quantity: 2, price: 29.99 });
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'cart:user-1',
        expect.any(String),
        'EX',
        604800,
      );
    });

    it('should increment quantity when adding an existing product', async () => {
      const existingCart = {
        userId: 'user-1',
        items: [{ productId: 'p1', quantity: 2, price: 29.99 }],
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cartService.addItem('user-1', {
        productId: 'p1',
        quantity: 3,
        price: 31.99,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(5); // 2 + 3
      expect(result.items[0].price).toBe(31.99); // price updated to latest
    });

    it('should add a second different product to the cart', async () => {
      const existingCart = {
        userId: 'user-1',
        items: [{ productId: 'p1', quantity: 1, price: 29.99 }],
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cartService.addItem('user-1', {
        productId: 'p2',
        quantity: 1,
        price: 49.99,
      });

      expect(result.items).toHaveLength(2);
    });
  });

  // ── removeItem ────────────────────────────────────────

  describe('removeItem', () => {
    it('should remove a product from the cart', async () => {
      const existingCart = {
        userId: 'user-1',
        items: [
          { productId: 'p1', quantity: 2, price: 29.99 },
          { productId: 'p2', quantity: 1, price: 49.99 },
        ],
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cartService.removeItem('user-1', 'p1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('p2');
    });

    it('should return the cart unchanged when removing a non-existent product', async () => {
      const existingCart = {
        userId: 'user-1',
        items: [{ productId: 'p1', quantity: 2, price: 29.99 }],
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await cartService.removeItem('user-1', 'nonexistent');

      expect(result.items).toHaveLength(1);
    });
  });

  // ── clearCart ──────────────────────────────────────────

  describe('clearCart', () => {
    it('should delete the cart key from Redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await cartService.clearCart('user-1');

      expect(mockRedisClient.del).toHaveBeenCalledWith('cart:user-1');
    });
  });
});
