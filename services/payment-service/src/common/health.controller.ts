/**
 * @file health.controller.ts  (payment-service)
 * @description Health check endpoints for container orchestration probes.
 *
 * Payment-service does not use Prisma/PostgreSQL. The readiness check
 * instead validates that the service has fully initialised (i.e., the
 * NestJS application bootstrap completed and is ready to accept HTTP traffic).
 *
 * Endpoints:
 *  GET /health        → Liveness probe.  Always 200 if the process is alive.
 *  GET /health/ready  → Readiness probe. Always 200 once the app has booted.
 */

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('health')
export class HealthController {

  /** Liveness probe — always 200 if process is alive */
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness() {
    return {
      status: 'alive',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe — 200 once the app has fully started.
   * Since payment-service is stateless (no DB), it is considered ready
   * as soon as the HTTP server is bound and this handler is reachable.
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  readiness() {
    return {
      status: 'ready',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    };
  }
}
