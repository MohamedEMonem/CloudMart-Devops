import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OutboxRelayService } from './outbox-relay.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
  providers: [OutboxRelayService],
  exports: [OutboxRelayService],
})
export class OutboxModule {}
