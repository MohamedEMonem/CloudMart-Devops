/**
 * @file main.ts  (order-service)
 * @description Application bootstrap. Starts the NestJS application after the
 * database connection manager (via PrismaService.onModuleInit) has either
 * successfully connected or exhausted all retries and called process.exit(1).
 *
 * Key points:
 *  - app.enableShutdownHooks() ensures PrismaService.onModuleDestroy() is called
 *    on SIGTERM/SIGINT so the DB connection pool is cleanly released.
 *  - The server only binds to the port AFTER all module lifecycle hooks complete,
 *    meaning the DB is confirmed ready before the first request is served.
 *  - RabbitMQ microservices (saga consumers + DLQ) are also started in this
 *    bootstrap to enable the order event processing pipeline.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('OrderService');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'fatal'],
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  // Enables NestJS to call onModuleDestroy() hooks on SIGTERM/SIGINT,
  // which triggers PrismaService.$disconnect() before the pod exits.
  app.enableShutdownHooks();

  // ── Global API Prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Input Validation ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // ── RabbitMQ microservice (saga consumer) ───────────────────────────────────
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

  // ── Dead Letter Queue Consumer ──────────────────────────────────────────────
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

  // ── Bind HTTP Port ─────────────────────────────────────────────────────────
  // This line is only reached if onModuleInit() in PrismaService completed
  // successfully (i.e., DB connected). If the DB was unreachable after all
  // retries, process.exit(1) was already called inside connectWithRetry().
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`📋 Order Service running on port ${port}`);
  logger.log(`📡 Listening on queues: order_events, order_events_dlq`);
  logger.log(`🩺 Liveness  probe: GET /health`);
  logger.log(`🩺 Readiness probe: GET /health/ready`);
}

bootstrap();
