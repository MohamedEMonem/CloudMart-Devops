// ──────────────────────────────────────────────
// Saga Event Contracts (Inventory Consumer Copy)
// Mirrors order-service/src/events/order-created.event.ts
// ──────────────────────────────────────────────

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: OrderCreatedItem[];
  vendorSplits: OrderCreatedVendorSplit[];
  createdAt: string;
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
