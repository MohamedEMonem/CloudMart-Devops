import { Router, Request, Response } from 'express';
import * as cartService from './cart.service';

export const cartRouter = Router();

/**
 * GET /api/v1/cart?userId=xxx
 * Get current user's cart.
 *
 * Response: { "userId": "...", "items": [{ "productId": "...", "quantity": 2, "price": 29.99 }], "updatedAt": "..." }
 */
cartRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }
  const cart = await cartService.getCart(userId);
  res.json(cart);
});

/**
 * POST /api/v1/cart/items
 * Add an item to the cart.
 *
 * Request:  { "userId": "...", "productId": "...", "quantity": 2, "price": 29.99 }
 * Response: { "userId": "...", "items": [...], "updatedAt": "..." }
 */
cartRouter.post('/items', async (req: Request, res: Response) => {
  const { userId, productId, quantity, price } = req.body;
  if (!userId || !productId || !quantity || !price) {
    return res.status(400).json({ error: 'userId, productId, quantity, and price are required' });
  }
  const cart = await cartService.addItem(userId, { productId, quantity, price });
  res.status(201).json(cart);
});

/**
 * DELETE /api/v1/cart/items/:productId?userId=xxx
 * Remove an item from the cart.
 *
 * Response: { "userId": "...", "items": [...], "updatedAt": "..." }
 */
cartRouter.delete('/items/:productId', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }
  const cart = await cartService.removeItem(userId, req.params.productId);
  res.json(cart);
});
