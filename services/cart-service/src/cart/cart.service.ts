import { redisClient, CART_TTL_SECONDS } from '../config/redis';
import { Cart, CartItem } from './cart.model';

const cartKey = (userId: string) => `cart:${userId}`;

export async function getCart(userId: string): Promise<Cart> {
  const data = await redisClient.get(cartKey(userId));
  if (!data) {
    return { userId, items: [], updatedAt: new Date().toISOString() };
  }
  return JSON.parse(data);
}

export async function addItem(userId: string, item: CartItem): Promise<Cart> {
  const cart = await getCart(userId);

  const existingIndex = cart.items.findIndex((i) => i.productId === item.productId);
  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
    cart.items[existingIndex].price = item.price;
  } else {
    cart.items.push(item);
  }

  cart.updatedAt = new Date().toISOString();
  await redisClient.set(cartKey(userId), JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
  return cart;
}

export async function removeItem(userId: string, productId: string): Promise<Cart> {
  const cart = await getCart(userId);
  cart.items = cart.items.filter((i) => i.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  await redisClient.set(cartKey(userId), JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  await redisClient.del(cartKey(userId));
}
