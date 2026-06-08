/**
 * Anti-Corruption Layer (ACL) — Payment Gateway Interface
 *
 * All external payment gateways must implement this interface.
 * This isolates our domain from third-party API changes.
 */
export interface ChargeRequest {
  orderId: string;
  amount: number;
  currency: string;
  token: string;
}

export interface ChargeResponse {
  paymentId: string;
  orderId: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  gatewayTransactionId: string;
  processedAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'REFUNDED' | 'PENDING' | 'FAILED';
}

export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  getStatus(paymentId: string): Promise<{ paymentId: string; status: string; gatewayTransactionId: string }>;
}
