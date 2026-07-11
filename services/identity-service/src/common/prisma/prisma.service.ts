/**
 * @file prisma.service.ts  (identity-service)
 * @description NestJS injectable wrapper around PrismaClient.
 *
 * Lifecycle:
 *  - onModuleInit  → calls connectWithRetry() (exponential backoff, auto-exit on failure)
 *  - onModuleDestroy → gracefully disconnects to release the connection pool
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { connectWithRetry } from './db-connection-manager';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Called automatically by NestJS when this module is initialised.
   * Delegates to connectWithRetry() which handles all retry / backoff logic
   * and sets the global `isDbConnected` flag on success.
   */
  async onModuleInit(): Promise<void> {
    await connectWithRetry(this, 'PrismaService[identity-service]');
  }

  /**
   * Called automatically by NestJS on graceful shutdown (SIGTERM / SIGINT).
   * Cleanly releases the underlying connection pool so the DB doesn't hold
   * idle connections after the pod terminates.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('[DB] Disconnecting from PostgreSQL on module destroy...');
    await this.$disconnect();
    this.logger.log('[DB] PostgreSQL connection closed.');
  }
}
