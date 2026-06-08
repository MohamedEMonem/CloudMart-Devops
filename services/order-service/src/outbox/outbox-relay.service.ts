import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Outbox Relay Service
 *
 * Polls the outbox_messages table for PENDING events and
 * publishes them to RabbitMQ. This guarantees at-least-once
 * delivery even if the app crashed between the DB commit
 * and the initial RMQ publish attempt.
 *
 * Runs on a 5-second polling interval. In production, consider
 * using PostgreSQL LISTEN/NOTIFY or Change Data Capture (Debezium)
 * for lower latency.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rmqClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // Ensure the RMQ connection is established before polling
    await this.rmqClient.connect();
    this.logger.log('Outbox relay connected to RabbitMQ');
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    // Prevent overlapping runs
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Fetch up to 50 unsent messages, oldest first
      const pendingMessages = await this.prisma.outboxMessage.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      if (pendingMessages.length === 0) return;

      this.logger.log(`Relay processing ${pendingMessages.length} pending outbox messages`);

      for (const msg of pendingMessages) {
        try {
          // Publish to RabbitMQ
          this.rmqClient.emit(msg.eventType, msg.payload);

          // Mark as sent
          await this.prisma.outboxMessage.update({
            where: { id: msg.id },
            data:  { status: 'SENT', processedAt: new Date() },
          });
        } catch (error) {
          // Increment retry count; mark as FAILED after 5 attempts
          const newRetryCount = msg.retryCount + 1;
          await this.prisma.outboxMessage.update({
            where: { id: msg.id },
            data: {
              retryCount: newRetryCount,
              status: newRetryCount >= 5 ? 'FAILED' : 'PENDING',
            },
          });
          this.logger.error(`Relay failed to publish outbox ${msg.id} (retry ${newRetryCount})`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
