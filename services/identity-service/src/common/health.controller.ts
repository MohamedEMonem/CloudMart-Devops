/**
 * @file health.controller.ts  (identity-service)
 * @description Provides two health check endpoints for container orchestration probes.
 *
 * Endpoints:
 *  GET /health        → Liveness probe. Always returns 200 if the process is alive.
 *  GET /health/ready  → Readiness probe. Returns 200 only when the DB is connected.
 *                       Returns 503 when the DB is not yet ready or has disconnected.
 *
 * Kubernetes probe configuration example:
 *  livenessProbe:
 *    httpGet:
 *      path: /health
 *      port: 3000
 *    initialDelaySeconds: 5
 *    periodSeconds: 10
 *
 *  readinessProbe:
 *    httpGet:
 *      path: /health/ready
 *      port: 3000
 *    initialDelaySeconds: 5
 *    periodSeconds: 5
 *    failureThreshold: 6
 */

import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { isDbConnected } from './prisma/db-connection-manager';

@Controller('health')
export class HealthController {

  /**
   * Liveness probe.
   * Confirms the Node.js process is running. Does NOT check the database —
   * the liveness probe should never cause an unnecessary pod restart due to
   * a slow DB startup.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness() {
    return {
      status: 'alive',
      service: 'identity-service',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe.
   * Returns HTTP 200 only when the database connection has been established.
   * Returns HTTP 503 (Service Unavailable) otherwise so Kubernetes stops
   * routing traffic to this pod until the DB is ready.
   */
  @Get('ready')
  readiness(@Res() res: Response) {
    if (isDbConnected) {
      return res.status(HttpStatus.OK).json({
        status: 'ready',
        service: 'identity-service',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      status: 'not_ready',
      service: 'identity-service',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
}
