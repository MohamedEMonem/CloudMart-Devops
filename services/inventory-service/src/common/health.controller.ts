import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { isDbConnected } from './prisma/db-connection-manager';

@Controller('health')
export class HealthController {

  /** Liveness probe — always 200 if process is alive */
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness() {
    return { status: 'alive', service: 'inventory-service', timestamp: new Date().toISOString() };
  }

  /** Readiness probe — 200 only when DB is connected, 503 otherwise */
  @Get('ready')
  readiness(@Res() res: Response) {
    if (isDbConnected) {
      return res.status(HttpStatus.OK).json({
        status: 'ready', service: 'inventory-service', database: 'connected', timestamp: new Date().toISOString(),
      });
    }
    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      status: 'not_ready', service: 'inventory-service', database: 'disconnected', timestamp: new Date().toISOString(),
    });
  }
}
