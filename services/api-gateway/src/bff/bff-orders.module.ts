import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BffOrdersController } from './bff-orders.controller';
import { BffOrdersService } from './bff-orders.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [BffOrdersController],
  providers: [BffOrdersService],
})
export class BffOrdersModule {}
