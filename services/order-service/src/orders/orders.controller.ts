import { Controller, Get, Post, Patch, Param, Body, Query, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaymentFailedEvent, PaymentCompletedEvent } from '../events/order-created.event';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  // ── REST Endpoints ──────────────────────────────────

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get()
  async findAll(
    @Query('vendorId') vendorId?: string,
    @Query('userId') userId?: string,
  ) {
    if (userId) return this.ordersService.findByUser(userId);
    if (vendorId) return this.ordersService.findByVendor(vendorId);
    return { error: 'userId or vendorId query param required' };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  // ──────────────────────────────────────────────────────
  // SAGA EVENT HANDLERS
  // ──────────────────────────────────────────────────────

  /**
   * Saga Compensation: Payment failed → Cancel order
   *
   * Choreography flow:
   *   order.created → [Inventory reserves] → [Payment fails]
   *   → payment.failed consumed here → Order → CANCELLED
   *   → payment.failed consumed by Inventory → Stock released
   */
  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.warn(`[Saga] payment.failed received — orderId: ${event.orderId}`);

    try {
      await this.ordersService.handlePaymentFailed(event);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`[Saga] Failed to cancel order ${event.orderId}`, error);
      channel.nack(originalMsg, false, true); // requeue — must not lose cancellations
    }
  }

  /**
   * Saga Success: Payment completed → Confirm order
   */
  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload() event: PaymentCompletedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`[Saga] payment.completed received — orderId: ${event.orderId}`);

    try {
      await this.ordersService.handlePaymentCompleted(event);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`[Saga] Failed to confirm order ${event.orderId}`, error);
      channel.nack(originalMsg, false, true);
    }
  }

  // ──────────────────────────────────────────────────────
  // DEAD LETTER QUEUE HANDLER
  // Messages that failed after max retries land here.
  // ──────────────────────────────────────────────────────

  @EventPattern('dlq.order_events')
  async handleDlqMessage(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const headers = originalMsg.properties.headers || {};

    this.logger.error(`[DLQ] Dead-lettered message received`, {
      originalQueue:   headers['x-first-death-queue'],
      originalReason:  headers['x-first-death-reason'],
      deathCount:      headers['x-death']?.[0]?.count,
      eventType:       originalMsg.fields?.routingKey,
      payload:         JSON.stringify(data).substring(0, 500),
    });

    // TODO: In production, persist to a failed_events table
    // for manual inspection, or trigger an alert.

    channel.ack(originalMsg); // ack so DLQ doesn't grow unbounded
  }
}
