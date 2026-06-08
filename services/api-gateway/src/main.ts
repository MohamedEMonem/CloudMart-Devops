import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' }); // tighten in production

  // ── WebSocket Adapter ─────────────────────────────
  // Use the Socket.io IoAdapter so @WebSocketGateway
  // runs on the same HTTP server (same port 3000).
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚪 API Gateway running on port ${port}`);
  logger.log(`🔌 WebSocket available at ws://localhost:${port}/ws/v1`);
}

bootstrap();
