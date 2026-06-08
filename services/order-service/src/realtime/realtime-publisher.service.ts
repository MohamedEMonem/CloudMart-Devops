import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrderStatusUpdatedEvent } from '../events/order-created.event';

/**
 * Realtime Event Publisher
 *
 * Publishes order status changes to a DEDICATED fanout exchange
 * ('realtime_exchange') separate from the saga queue ('order_events').
 *
 * Why a separate exchange?
 *   - Saga consumers on 'order_events' use competing consumers
 *     (one consumer processes each message).
 *   - The WebSocket gateway needs its OWN copy of every event.
 *   - A fanout exchange broadcasts to ALL bound queues, so the
 *     gateway gets every event without competing with sagas.
 */
@Injectable()
export class RealtimePublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimePublisher.name);
  private connection: any = null;
  private channel: any = null;

  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
  private readonly EXCHANGE_NAME = 'realtime_exchange';

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });
      this.logger.log(`📡 Realtime publisher connected — exchange: ${this.EXCHANGE_NAME}`);
    } catch (err) {
      this.logger.error('Failed to connect realtime publisher to RabbitMQ', err);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // shutting down
    }
  }

  /**
   * Publish an order status update to the realtime fanout exchange.
   * The routing key is used for logging/filtering but fanout
   * delivers to ALL bound queues regardless.
   */
  publishOrderStatusUpdate(event: OrderStatusUpdatedEvent) {
    if (!this.channel) {
      this.logger.warn('Realtime publisher not connected — event dropped');
      return;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(event));
      this.channel.publish(
        this.EXCHANGE_NAME,
        'order.status.updated', // routing key (informational for fanout)
        buffer,
        { persistent: true, contentType: 'application/json' },
      );
      this.logger.log(`📡 Published order.status.updated — order: ${event.orderId}, status: ${event.status}`);
    } catch (err) {
      this.logger.error('Failed to publish realtime event', err);
    }
  }
}
