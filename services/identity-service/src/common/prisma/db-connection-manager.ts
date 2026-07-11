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

// ─── Configuration ─────────────────────────────────────────────────────────────
const MAX_RETRIES = parseInt(process.env.DB_CONNECT_MAX_RETRIES ?? '10', 10);
const INITIAL_DELAY_MS = parseInt(process.env.DB_CONNECT_INITIAL_DELAY ?? '2000', 10);

// ─── Global Health Flag ────────────────────────────────────────────────────────
/**
 * Exported boolean that reflects the current database connection state.
 * - Set to `true` once the first successful $connect() completes.
 * - Set to `false` if a runtime error event fires (e.g., TCP reset, idle timeout).
 *
 * Consumed by the /health (readiness) endpoint to block Kubernetes traffic
 * until the DB is reachable.
 */
export let isDbConnected = false;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 * Used to implement the backoff wait between retry attempts.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculates the delay for a given attempt index using pure exponential backoff:
 *   delay = initialDelay * 2^(attempt)
 *
 * Examples with initialDelay = 2000ms:
 *   attempt 0 → 2 000 ms
 *   attempt 1 → 4 000 ms
 *   attempt 2 → 8 000 ms
 *   attempt 3 → 16 000 ms
 *   …
 *
 * The delay is capped at 60 seconds to avoid unbounded waits in bad states.
 */
const getBackoffDelay = (attempt: number): number =>
  Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), 60_000);

// ─── Runtime Disconnection Listener ───────────────────────────────────────────

/**
 * Attaches a listener to the Prisma client's internal error event bus.
 * If the DB drops the connection AFTER a successful start (e.g., a pod restart,
 * a network partition, or an RDS failover), this handler:
 *   1. Logs the error at FATAL level for alerting/scraping.
 *   2. Sets `isDbConnected = false` so the readiness probe fails immediately,
 *      allowing Kubernetes to stop routing new traffic to this pod.
 *
 * NOTE: Prisma does NOT automatically reconnect on runtime errors.
 * The container will be restarted by K8s liveness/readiness probes, which
 * is the correct recovery pattern for containerised workloads.
 */
function attachRuntimeErrorListener(client: PrismaClient, logger: Logger): void {
  // $on is typed for specific event names in Prisma v5+
  (client as any).$on('error', (event: { message: string; target: string }) => {
    isDbConnected = false;
    logger.fatal(
      `[DB Runtime Error] Prisma reported a connection-level error. ` +
        `The database may have dropped the connection. ` +
        `Marking service as NOT ready. ` +
        `Error: ${event.message} | Target: ${event.target}`,
    );
  });
}

// ─── Main Export: connectWithRetry ─────────────────────────────────────────────

/**
 * Calls `client.$connect()` in a retry loop with exponential backoff.
 *
 * Algorithm:
 * ```
 * for attempt in [0 .. MAX_RETRIES - 1]:
 *   try:
 *     await client.$connect()
 *     isDbConnected = true
 *     return                         ← success path
 *   catch (err):
 *     if attempt < MAX_RETRIES - 1:
 *       wait(initialDelay * 2^attempt)
 *       continue
 *     else:
 *       log FATAL
 *       process.exit(1)              ← signals container engine to restart the pod
 * ```
 *
 * @param client  - The PrismaClient instance to connect.
 * @param context - A string label (e.g. service name) used in log messages.
 */
export async function connectWithRetry(
  client: PrismaClient,
  context: string = 'PrismaService',
): Promise<void> {
  const logger = new Logger(context);

  // Attach the runtime error listener once, before the first connect attempt.
  attachRuntimeErrorListener(client, logger);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.log(
        `[DB] Attempting database connection... ` +
          `(attempt ${attempt + 1} / ${MAX_RETRIES})`,
      );

      await client.$connect();

      // ── Success ────────────────────────────────────────────────────────────
      isDbConnected = true;
      logger.log(
        `[DB] ✅ Successfully connected to PostgreSQL on attempt ${attempt + 1}.`,
      );
      return; // Exit the retry loop — all done.

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      // ── Failure but retries remain ─────────────────────────────────────────
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = getBackoffDelay(attempt);
        logger.warn(
          `[DB] ⚠️  Connection attempt ${attempt + 1} failed: ${message}. ` +
            `Retrying in ${delayMs / 1000}s...`,
        );
        await sleep(delayMs);

      } else {
        // ── All retries exhausted ──────────────────────────────────────────
        // Log a distinct FATAL message so monitoring/alerting systems can
        // distinguish a startup DB failure from a transient runtime error.
        logger.fatal(
          `[DB] ❌ FATAL: Could not connect to the database after ` +
            `${MAX_RETRIES} attempts. The database appears to be unreachable. ` +
            `Last error: ${message}. ` +
            `Exiting with code 1 — the container orchestrator will restart this pod.`,
        );

        // Exit with a non-zero code so Docker / Kubernetes marks the container
        // as failed and applies its restart policy.
        process.exit(1);
      }
    }
  }
}
