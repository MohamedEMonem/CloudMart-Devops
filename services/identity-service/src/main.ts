/**
 * @file main.ts  (identity-service)
 * @description Application bootstrap. Starts the NestJS application after the
 * database connection manager (via PrismaService.onModuleInit) has either
 * successfully connected or exhausted all retries and called process.exit(1).
 *
 * Key points:
 *  - app.enableShutdownHooks() ensures PrismaService.onModuleDestroy() is called
 *    on SIGTERM/SIGINT so the DB connection pool is cleanly released.
 *  - The server only binds to the port AFTER all module lifecycle hooks complete,
 *    meaning the DB is confirmed ready before the first request is served.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('IdentityService');

  const app = await NestFactory.create(AppModule, {
    // Suppress NestJS banner for cleaner container logs
    logger: ['log', 'warn', 'error', 'fatal'],
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  // This enables NestJS to call onModuleDestroy() hooks on SIGTERM/SIGINT,
  // which triggers PrismaService.$disconnect() before the pod exits.
  app.enableShutdownHooks();

  // ── Global API Prefix ──────────────────────────────────────────────────────

  app.setGlobalPrefix('v1');

  // ── Input Validation ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Bind Port ─────────────────────────────────────────────────────────────
  // This line is only reached if onModuleInit() in PrismaService completed
  // successfully (i.e., DB connected). If the DB was unreachable after all
  // retries, process.exit(1) was already called inside connectWithRetry().
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🔐 Identity Service running on port ${port}`);
  logger.log(`🩺 Liveness  probe: GET /health`);
  logger.log(`🩺 Readiness probe: GET /health/ready`);
}

bootstrap();
