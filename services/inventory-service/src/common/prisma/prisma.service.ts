import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { connectWithRetry } from './db-connection-manager';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await connectWithRetry(this, 'PrismaService[inventory-service]');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('[DB] Disconnecting from PostgreSQL on module destroy...');
    await this.$disconnect();
  }
}
