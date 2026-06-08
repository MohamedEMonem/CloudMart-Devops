import apiClient from './client';

// ── Types ───────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number; priceAtPurchase: number }[];
  vendorSplits?: { vendorId: string; amount: number }[];
}

// ── API calls ───────────────────────────────────────────────
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', payload);
  return data;
}

export async function getOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
  return data;
}

export async function getMyOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders');
  return data;
}

export async function getOrderHistory() {
  const { data } = await apiClient.get('/bff/orders/history');
  return data;
}
