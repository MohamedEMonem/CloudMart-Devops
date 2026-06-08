import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // ── RabbitMQ microservice (saga consumer) ───────────
  // Listens for payment.failed → cancel order
  //            payment.completed → confirm order
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
      queue: 'order_events',
      queueOptions: {
        durable: true,
        // ── Dead Letter Exchange (DLX) Configuration ──────
        // If a consumer nacks a message with requeue=false,
        // RabbitMQ automatically routes it to this exchange
        // which feeds into the order_events_dlq queue.
        arguments: {
          'x-dead-letter-exchange': 'order_events_dlx',
          'x-dead-letter-routing-key': 'order_events_dlq',
        },
      },
      noAck: false,
    },
  });

  // ── Dead Letter Queue Consumer ──────────────────────
  // Separate microservice listening on the DLQ for
  // messages that failed processing after all retries.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
      queue: 'order_events_dlq',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`📋 Order Service running on port ${port}`);
  logger.log(`📡 Listening on queues: order_events, order_events_dlq`);
}

bootstrap();
