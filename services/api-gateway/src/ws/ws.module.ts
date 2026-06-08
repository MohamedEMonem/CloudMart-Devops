import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RealtimeConsumerService } from './realtime-consumer.service';

@Module({
  providers: [EventsGateway, RealtimeConsumerService],
  exports: [EventsGateway],
})
export class WsModule {}
