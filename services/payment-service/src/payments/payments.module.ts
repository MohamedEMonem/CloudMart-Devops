import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeGateway } from '../gateways/stripe.gateway';
import { PaypalGateway } from '../gateways/paypal.gateway';

@Module({
  imports: [
    HttpModule,
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
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeGateway, PaypalGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
