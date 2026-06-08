import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    HttpModule,
    PaymentsModule,

    // ── RabbitMQ Client (Publisher) ──────────────────
    // Used to emit payment.failed / payment.completed
    // saga events back to the order_events queue.
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
export class AppModule {}
