import apiClient from '@/lib/api/client';

// ── Types ───────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  vendorId: string;
  quantity: number;
  unitPrice: string | number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: string | number;
  shippingAddress: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// ── API calls ───────────────────────────────────────────────

/** GET /orders?userId=xxx */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders', { params: { userId } });
  return data;
}

/** GET /orders/:id */
export async function getOrderById(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
  return data;
}
