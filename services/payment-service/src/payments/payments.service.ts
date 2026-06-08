import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { StripeGateway } from '../gateways/stripe.gateway';
import { PaypalGateway } from '../gateways/paypal.gateway';
import { PaymentGateway } from '../gateways/payment-gateway.interface';
import {
  OrderCreatedEvent,
  PaymentFailedEvent,
  PaymentCompletedEvent,
} from '../events/saga-events';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly gateways: Record<string, PaymentGateway>;

  constructor(
    private readonly stripeGateway: StripeGateway,
    private readonly paypalGateway: PaypalGateway,
    @Inject('RABBITMQ_SERVICE') private readonly rmqClient: ClientProxy,
  ) {
    this.gateways = {
      stripe: this.stripeGateway,
      paypal: this.paypalGateway,
    };
  }

  // ── REST API: Direct payment processing ─────────────
  async processPayment(dto: ProcessPaymentDto) {
    const gateway = this.gateways[dto.paymentMethod];
    if (!gateway) {
      throw new BadRequestException(`Unsupported payment method: ${dto.paymentMethod}`);
    }

    return gateway.charge({
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency,
      token: dto.gatewayToken,
    });
  }

  // ── Saga: Process payment triggered by order.created ──
  // Called from the PaymentsController @EventPattern handler.
  // On failure → emits payment.failed (triggers compensation).
  // On success → emits payment.completed (triggers confirmation).
  async processOrderPayment(event: OrderCreatedEvent) {
    this.logger.log(`Processing payment for order ${event.orderId} — $${event.totalAmount}`);

    try {
      // Attempt to charge via the default gateway (Stripe)
      // In production, the payment method would come from
      // the user's saved payment profile or the event payload.
      const result = await this.stripeGateway.charge({
        orderId: event.orderId,
        amount:  event.totalAmount,
        currency: 'USD',
        token:    'tok_from_event', // would be real token in production
      });

      // ── SUCCESS: Emit payment.completed ─────────────────
      const completedEvent: PaymentCompletedEvent = {
        orderId:              event.orderId,
        userId:               event.userId,
        paymentId:            result.paymentId,
        gatewayTransactionId: result.gatewayTransactionId,
        amount:               event.totalAmount,
        completedAt:          new Date().toISOString(),
      };

      this.rmqClient.emit('payment.completed', completedEvent);
      this.logger.log(`payment.completed emitted for order ${event.orderId}`);

      return result;
    } catch (error) {
      // ── FAILURE: Emit payment.failed (triggers saga compensation) ──
      const failedEvent: PaymentFailedEvent = {
        orderId:  event.orderId,
        userId:   event.userId,
        reason:   error instanceof Error ? error.message : 'Gateway charge failed',
        failedAt: new Date().toISOString(),
        // Carry the original items so Inventory can reverse
        // without needing a sync call back to Order Service.
        items: event.items,
      };

      this.rmqClient.emit('payment.failed', failedEvent);
      this.logger.error(`payment.failed emitted for order ${event.orderId}: ${failedEvent.reason}`);
    }
  }

  async refundPayment(dto: RefundPaymentDto) {
    return this.stripeGateway.refund({
      paymentId: dto.paymentId,
      amount: dto.amount,
      reason: dto.reason,
    });
  }

  async getPaymentStatus(paymentId: string) {
    return this.stripeGateway.getStatus(paymentId);
  }
}
