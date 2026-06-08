// ──────────────────────────────────────────────
// Saga Event Contracts
// Shared across all services participating in
// the order placement choreography saga.
// ──────────────────────────────────────────────

// ── Published by: Order Service ────────────────
export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: OrderCreatedItem[];
  vendorSplits: OrderCreatedVendorSplit[];
  createdAt: string; // ISO 8601
}

export interface OrderCreatedItem {
  productId: string;
  vendorId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderCreatedVendorSplit {
  vendorId: string;
  subtotal: number;
  commissionAmount: number;
  vendorPayout: number;
}

// ── Published by: Payment Service ──────────────
export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
  reason: string;
  failedAt: string;
  items: OrderCreatedItem[];
}

export interface PaymentCompletedEvent {
  orderId: string;
  userId: string;
  paymentId: string;
  gatewayTransactionId: string;
  amount: number;
  completedAt: string;
}

// ── Published by: Order Service ────────────────
// Emitted to 'realtime_exchange' (fanout) when any
// order status changes. The API Gateway consumes this
// and pushes it to the user's active WebSocket.
export interface OrderStatusUpdatedEvent {
  orderId: string;
  userId: string;
  previousStatus: string;
  status: string;
  updatedAt: string;
}
