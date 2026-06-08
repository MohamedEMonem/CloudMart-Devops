import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [HealthController],
})
export class AppModule {}
