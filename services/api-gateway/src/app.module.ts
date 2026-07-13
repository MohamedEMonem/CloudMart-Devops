import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { HealthController } from './common/health.controller';
import { JwtAuthMiddleware } from './middleware/jwt-auth.middleware';
import { ProxyModule } from './proxy/proxy.module';
import { BffOrdersModule } from './bff/bff-orders.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ProxyModule,
    BffOrdersModule,  // BFF Data Aggregation endpoints
    WsModule,         // Real-time WebSocket + RabbitMQ consumer
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply JWT validation globally — except public routes
    // Note: WebSocket auth is handled in EventsGateway.handleConnection(),
    // not by this HTTP middleware.
    consumer
      .apply(JwtAuthMiddleware)
      .exclude(
        { path: 'v1/auth/register',   method: RequestMethod.POST },
        { path: 'v1/auth/login',       method: RequestMethod.POST },
        { path: 'v1/health',           method: RequestMethod.GET },
        { path: 'v1/products',         method: RequestMethod.GET },
        { path: 'v1/products/(.*)',    method: RequestMethod.GET },
        { path: 'v1/users/vendors',    method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
