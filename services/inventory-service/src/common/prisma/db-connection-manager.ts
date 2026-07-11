/**
 * @file db-connection-manager.ts
 * @description Production-ready Prisma database connection manager.
 *
 * Responsibilities:
 *  - Retries $connect() with exponential backoff on ECONNREFUSED / startup races.
 *  - Exports `isDbConnected` so health/readiness probes can gate traffic.
 *  - Registers a $on('error') listener to log runtime (mid-lifecycle) disconnections.
 *  - Exits process with code 1 after exhausting all retries (signals Docker/K8s to restart).
 *
 * Configuration via environment variables (all optional, sane defaults provided):
 *  - DB_CONNECT_MAX_RETRIES   — how many times to attempt before giving up  (default: 10)
 *  - DB_CONNECT_INITIAL_DELAY — first wait in milliseconds before retry 1    (default: 2000)
 */

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const MAX_RETRIES = parseInt(process.env.DB_CONNECT_MAX_RETRIES ?? '10', 10);
const INITIAL_DELAY_MS = parseInt(process.env.DB_CONNECT_INITIAL_DELAY ?? '2000', 10);

export let isDbConnected = false;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number): number =>
  Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), 60_000);

function attachRuntimeErrorListener(client: PrismaClient, logger: Logger): void {
  (client as any).$on('error', (event: { message: string; target: string }) => {
    isDbConnected = false;
    logger.fatal(
      `[DB Runtime Error] Prisma reported a connection-level error. ` +
        `Marking service as NOT ready. ` +
        `Error: ${event.message} | Target: ${event.target}`,
    );
  });
}

export async function connectWithRetry(
  client: PrismaClient,
  context: string = 'PrismaService',
): Promise<void> {
  const logger = new Logger(context);
  attachRuntimeErrorListener(client, logger);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.log(`[DB] Attempting database connection... (attempt ${attempt + 1} / ${MAX_RETRIES})`);
      await client.$connect();
      isDbConnected = true;
      logger.log(`[DB] ✅ Successfully connected to PostgreSQL on attempt ${attempt + 1}.`);
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = getBackoffDelay(attempt);
        logger.warn(`[DB] ⚠️  Connection attempt ${attempt + 1} failed: ${message}. Retrying in ${delayMs / 1000}s...`);
        await sleep(delayMs);
      } else {
        logger.fatal(
          `[DB] ❌ FATAL: Could not connect to the database after ${MAX_RETRIES} attempts. ` +
            `Last error: ${message}. Exiting with code 1.`,
        );
        process.exit(1);
      }
    }
  }
}
