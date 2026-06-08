import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersModule } from './orders/orders.module';
import { OutboxModule } from './outbox/outbox.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    PrismaModule,
    OrdersModule,
    OutboxModule, // Transactional Outbox Relay

    // ── RabbitMQ Client (Publisher) ──────────────────
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
          queue: 'order_events',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'order_events_dlx',
              'x-dead-letter-routing-key': 'order_events_dlq',
            },
          },
        },
      },
    ]),
  ],
  controllers: [HealthController],
  exports: [ClientsModule],
})
export class AppModule { }