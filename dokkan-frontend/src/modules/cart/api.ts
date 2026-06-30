import api from '@/lib/api/client';

// ── Types ────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  /** Enriched client-side only — not from API */
  productName?: string;
  vendorId?: string;
  vendorName?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

// ── API Calls ────────────────────────────────────────────────

/** GET /cart?userId=xxx */
export async function getCart(userId: string): Promise<Cart> {
  const { data } = await api.get<Cart>('/cart', { params: { userId } });
  return data;
}

/** POST /cart/items  — body: { userId, productId, quantity, price } */
export async function addCartItem(
  userId: string,
  item: { productId: string; quantity: number; price: number },
): Promise<Cart> {
  const { data } = await api.post<Cart>('/cart/items', { userId, ...item });
  return data;
}

/** DELETE /cart/items/:productId?userId=xxx */
export async function removeCartItem(
  userId: string,
  productId: string,
): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/items/${productId}`, {
    params: { userId },
  });
  return data;
}
