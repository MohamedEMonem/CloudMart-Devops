import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OrderCreatedEvent } from '../events/saga-events';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ── REST Endpoints ──────────────────────────────────

  @Post('process')
  async processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(dto);
  }

  @Post('refund')
  async refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto);
  }

  @Get(':paymentId/status')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  // ── Saga: Consume order.created to trigger payment ──
  // Part of the choreography saga:
  //   Order Created → Stock Reserved → [Payment Attempted]
  //   Success → payment.completed → Order Confirmed
  //   Failure → payment.failed → Stock Released + Order Cancelled
  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.paymentsService.processOrderPayment(event);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(`[Payment] Unhandled error processing order ${event.orderId}`, error);
      channel.nack(originalMsg, false, false); // don't requeue — let DLQ handle it
    }
  }
}
