import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { ReleaseStockDto } from './dto/release-stock.dto';
import { OrderCreatedEvent, PaymentFailedEvent } from '../events/order-created.event';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  // ── REST Endpoints ──────────────────────────────────

  @Get(':productId')
  async getStock(@Param('productId') productId: string) {
    return this.inventoryService.getStock(productId);
  }

  @Post('reserve')
  async reserveStock(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStock(dto);
  }

  @Post('release')
  async releaseStock(@Body() dto: ReleaseStockDto) {
    return this.inventoryService.releaseStock(dto);
  }

  // ──────────────────────────────────────────────────────
  // SAGA EVENT HANDLERS
  // ──────────────────────────────────────────────────────

  /**
   * Saga Step 2: Reserve stock when an order is created.
   * Triggered by: order-service → 'order.created'
   */
  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const retryCount = (originalMsg.properties.headers?.['x-retry-count'] as number) ?? 0;

    this.logger.log(`[Saga] order.created received — orderId: ${event.orderId} (retry: ${retryCount})`);

    try {
      for (const item of event.items) {
        await this.inventoryService.reserveStock({
          productId:   item.productId,
          quantity:    item.quantity,
          referenceId: event.orderId,
        });
        this.logger.log(`[Saga] Reserved ${item.quantity}x ${item.productName}`);
      }

      channel.ack(originalMsg);
      this.logger.log(`[Saga] order.created fully processed — orderId: ${event.orderId}`);
    } catch (error) {
      this.logger.error(`[Saga] Failed to reserve stock — orderId: ${event.orderId}`, error);

      // ── DLQ Retry Logic ─────────────────────────────
      // If we've retried fewer than 3 times, nack with
      // requeue=false so RMQ routes to the DLX → DLQ.
      // The DLQ consumer (or manual inspection) handles
      // messages that exhausted all retries.
      if (retryCount < 3) {
        channel.nack(originalMsg, false, false);
      } else {
        // After 3 retries: ack to remove from main queue.
        // Message is already in the DLQ from previous nack.
        this.logger.error(`[DLQ] Max retries exceeded for order.created — orderId: ${event.orderId}`);
        channel.ack(originalMsg);
      }
    }
  }

  /**
   * Saga Compensation: Release reserved stock when payment fails.
   * Triggered by: payment-service → 'payment.failed'
   *
   * This is the compensating transaction in the choreography saga.
   * It reverses the stock reservations made in handleOrderCreated.
   */
  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.warn(`[Saga Compensation] payment.failed — orderId: ${event.orderId}, reason: ${event.reason}`);

    try {
      // Release reserved stock for each item in the original order.
      // The event carries the full item list so we don't need to
      // call back to Order Service (no synchronous coupling).
      for (const item of event.items) {
        await this.inventoryService.releaseStock({
          productId:   item.productId,
          quantity:    item.quantity,
          referenceId: event.orderId,
        });
        this.logger.log(`[Saga Compensation] Released ${item.quantity}x ${item.productName}`);
      }

      channel.ack(originalMsg);
      this.logger.log(`[Saga Compensation] Stock fully released for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(`[Saga Compensation] Failed to release stock — orderId: ${event.orderId}`, error);
      // Requeue: stock release is critical — must not be lost
      channel.nack(originalMsg, false, true);
    }
  }
}
