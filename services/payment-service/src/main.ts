import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // ── RabbitMQ microservice (saga consumer) ───────────
  // Listens on 'order_events' for 'order.created' to
  // trigger payment processing as part of the saga.
  app.connectMicroservice<MicroserviceOptions>({
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
      noAck: false,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`💳 Payment Service running on port ${port}`);
  console.log(`📡 Payment Service listening on RabbitMQ queue: order_events`);
}

bootstrap();
