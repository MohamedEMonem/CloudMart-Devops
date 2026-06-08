import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventsGateway, OrderStatusUpdatePayload } from './events.gateway';
import * as amqp from 'amqplib';

/**
 * RabbitMQ → WebSocket Bridge
 *
 * Connects directly to RabbitMQ using amqplib (not NestJS
 * microservices) so the gateway can consume from a DEDICATED
 * queue ('gateway_realtime_events') without competing with
 * the saga consumers on the 'order_events' queue.
 *
 * Architecture:
 *   Order Service → emits 'order.status.updated' to 'realtime_exchange' (fanout)
 *   → gateway_realtime_events queue bound to that exchange
 *   → This consumer reads it and calls EventsGateway.pushOrderUpdate()
 *
 * If the Order Service publishes to both 'order_events' (for sagas)
 * and 'realtime_exchange' (for WebSocket push), each concern is isolated.
 */
@Injectable()
export class RealtimeConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeConsumerService.name);
  private connection: any = null;
  private channel: any = null;

  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
  private readonly EXCHANGE_NAME = 'realtime_exchange';
  private readonly QUEUE_NAME = 'gateway_realtime_events';

  constructor(private readonly eventsGateway: EventsGateway) {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (err) {
      // Swallow — shutting down anyway
    }
  }

  private async connectWithRetry(retries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.setupConsumer();
        return;
      } catch (err) {
        this.logger.warn(
          `[RMQ] Connection attempt ${attempt}/${retries} failed — retrying in ${delayMs}ms`,
        );
        if (attempt === retries) {
          this.logger.error('[RMQ] All connection attempts exhausted — real-time push disabled');
          return;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  private async setupConsumer() {
    this.connection = await amqp.connect(this.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    // ── Declare exchange + queue + binding ──────────────
    // Fanout exchange: all messages go to all bound queues.
    // The gateway gets its own queue so it doesn't compete
    // with saga consumers.
    await this.channel!.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });
    await this.channel!.assertQueue(this.QUEUE_NAME, { durable: true });
    await this.channel!.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, '');

    // Prefetch 1 for ordered processing
    await this.channel!.prefetch(1);

    this.logger.log(`📡 Consuming from queue: ${this.QUEUE_NAME} (exchange: ${this.EXCHANGE_NAME})`);

    // ── Message handler ────────────────────────────────
    this.channel!.consume(this.QUEUE_NAME, (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey || '';

        this.logger.debug(`[RMQ] Received event: ${routingKey}`, content);

        this.handleRealtimeEvent(routingKey, content);
        this.channel!.ack(msg);
      } catch (err) {
        this.logger.error('[RMQ] Failed to process realtime event', err);
        this.channel!.nack(msg, false, false); // don't requeue — log and move on
      }
    });

    // ── Reconnect on unexpected close ──────────────────
    this.connection!.on('close', () => {
      this.logger.warn('[RMQ] Connection closed unexpectedly — attempting reconnect');
      setTimeout(() => this.connectWithRetry(3, 5000), 1000);
    });
  }

  // ──────────────────────────────────────────────────────
  // EVENT ROUTER
  // Maps incoming RMQ events to WebSocket push methods.
  // ──────────────────────────────────────────────────────
  private handleRealtimeEvent(eventType: string, data: any) {
    switch (eventType) {
      case 'order.status.updated': {
        const payload: OrderStatusUpdatePayload = {
          orderId:        data.orderId,
          userId:         data.userId,
          previousStatus: data.previousStatus,
          status:         data.status,
          updatedAt:      data.updatedAt,
        };

        // Push to the specific user who owns this order
        this.eventsGateway.pushOrderUpdate(payload.userId, payload);
        break;
      }

      // Future events can be added here:
      // case 'vendor.order.new':
      // case 'payment.refund.completed':

      default:
        this.logger.debug(`[RMQ] Unhandled realtime event: ${eventType}`);
    }
  }
}
