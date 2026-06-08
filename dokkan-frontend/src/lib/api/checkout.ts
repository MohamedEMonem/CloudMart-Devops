import api from './client';

// ── Types ────────────────────────────────────────────────────
export interface OrderItemPayload {
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderPayload {
  userId: string;
  items: OrderItemPayload[];
  shippingAddress: Record<string, any>;
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  items: OrderItemPayload[];
  createdAt: string;
}

// ── API Calls ────────────────────────────────────────────────

/** POST /orders */
export async function placeOrder(
  payload: CreateOrderPayload,
): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>('/orders', payload);
  return data;
}
