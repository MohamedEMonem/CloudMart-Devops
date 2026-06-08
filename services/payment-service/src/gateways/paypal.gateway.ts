import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentGateway, ChargeRequest, ChargeResponse, RefundRequest, RefundResponse } from './payment-gateway.interface';

/**
 * PayPal Gateway Adapter (Anti-Corruption Layer)
 *
 * This adapter translates our domain's payment concepts into
 * PayPal's API format. Currently stubbed for scaffolding.
 * TODO: Integrate real PayPal SDK in Phase 2.
 */
@Injectable()
export class PaypalGateway implements PaymentGateway {
  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    // TODO: Replace with actual PayPal Orders API call
    return {
      paymentId: `pay_${uuidv4()}`,
      orderId: request.orderId,
      status: 'COMPLETED',
      gatewayTransactionId: `PAYPAL-${uuidv4()}`,
      processedAt: new Date().toISOString(),
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // TODO: Replace with actual PayPal refund API call
    return {
      refundId: `re_${uuidv4()}`,
      status: 'REFUNDED',
    };
  }

  async getStatus(paymentId: string) {
    // TODO: Replace with actual PayPal retrieve call
    return {
      paymentId,
      status: 'COMPLETED',
      gatewayTransactionId: `PAYPAL-${uuidv4()}`,
    };
  }
}
