import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error', 'fatal'] });

  // Enables graceful shutdown hooks on SIGTERM/SIGINT
  app.enableShutdownHooks();

  app.setGlobalPrefix('v1');
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
  logger.log(`💳 Payment Service running on port ${port}`);
  logger.log(`📡 Payment Service listening on RabbitMQ queue: order_events`);
  logger.log(`🩺 Liveness  probe: GET /health`);
  logger.log(`🩺 Readiness probe: GET /health/ready`);
}

bootstrap();
