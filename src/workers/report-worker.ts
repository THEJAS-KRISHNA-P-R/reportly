import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { REPORT_QUEUE_NAME } from '@/lib/queue/client';
import { runReportGeneration } from '@/lib/services/reportService';
import { logger } from '@/lib/utils/logger';
import { updateJobStatus, moveToDLQ } from '@/lib/db/repositories/jobRepo';
import { updateReportStatus } from '@/lib/db/repositories/reportRepo';
import { buildSystemCorrelationId, getPayloadCorrelationId } from '@/lib/observability/correlation';
import { closeBrowser } from '@/lib/modules/pdf/generator';
import type { ReportPeriod } from '@/types/adapters';

// ── Concurrency: NEVER exceed 2 for Puppeteer safety ───────────────
const CONCURRENCY = Math.min(
  2,
  Math.max(1, Number(process.env.WORKER_CONCURRENCY ?? 2))
);

// ── Memory-Aware Circuit Breaker ────────────────────────────────────
const MEMORY_THRESHOLD_MB = 900; // Pause queue if RSS exceeds this
let isPaused = false;

function checkMemoryPressure() {
  const rss = process.memoryUsage().rss / 1024 / 1024;
  
  if (rss > MEMORY_THRESHOLD_MB && !isPaused) {
    logger.warn({ rssMB: Math.round(rss) }, 'Memory threshold exceeded. Pausing worker.');
    worker.pause();
    isPaused = true;
    
    // Auto-resume after 30s cooldown
    setTimeout(async () => {
      const currentRss = process.memoryUsage().rss / 1024 / 1024;
      if (currentRss < MEMORY_THRESHOLD_MB * 0.8) {
        logger.info({ rssMB: Math.round(currentRss) }, 'Memory recovered. Resuming worker.');
        await worker.resume();
        isPaused = false;
      } else {
        logger.warn({ rssMB: Math.round(currentRss) }, 'Memory still high after cooldown. Forcing GC and retrying.');
        if (global.gc) global.gc();
        await worker.resume();
        isPaused = false;
      }
    }, 30_000);
  }
}

function parseReportPeriod(payload: any): ReportPeriod {
  const { periodStart, periodEnd, label = 'Custom' } = payload;
  if (!periodStart || !periodEnd) {
    throw new Error('Job payload missing periodStart/periodEnd');
  }
  return { 
    start: new Date(periodStart), 
    end: new Date(periodEnd), 
    label 
  };
}

/**
 * Process a report generation job from BullMQ.
 */
async function processReportJob(job: Job) {
  // Memory circuit breaker check before processing
  checkMemoryPressure();

  const { jobId: dbJobId, clientId, agencyId, reportId, payload } = job.data;
  const correlationId = getPayloadCorrelationId(payload) || buildSystemCorrelationId(`bull.${job.id}`);
  
  logger.info({ 
    jobId: job.id, 
    dbJobId, 
    reportId, 
    attempt: job.attemptsMade + 1,
    correlationId,
    rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  }, 'Worker: Starting report generation');

  try {
    // 1. Update DB status to 'processing'
    await updateJobStatus(dbJobId, 'processing', {
      started_at: new Date().toISOString(),
      attempts: job.attemptsMade + 1,
      bull_job_id: job.id,
    });

    const period = parseReportPeriod(payload);

    // 2. Run the actual pipeline
    await runReportGeneration(
      clientId,
      agencyId,
      period,
      reportId,
      dbJobId,
      {
        attempt: job.attemptsMade + 1,
        correlationId,
        runKey: payload.runKey,
        idempotencyKey: payload.idempotencyKey,
        maxAttempts: job.opts.attempts || 3,
        mock: payload.mock === true,
      }
    );

    // 3. Update DB to 'completed'
    await updateJobStatus(dbJobId, 'completed', {
      completed_at: new Date().toISOString(),
    });

    logger.info({ 
      jobId: job.id, 
      dbJobId, 
      reportId,
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    }, 'Worker: Job completed successfully');
    
    // Manual GC trigger to prevent leak creep
    if (global.gc) {
      global.gc();
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';

    logger.error({ 
      jobId: job.id, 
      dbJobId, 
      err: errorMessage,
      attempt: job.attemptsMade + 1,
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    }, 'Worker: Job processing failed');

    const maxAttempts = job.opts.attempts || 3;
    const isFinalAttempt = (job.attemptsMade + 1) >= maxAttempts;

    if (isFinalAttempt) {
      // Mark report as definitively failed
      await updateReportStatus(reportId, agencyId, 'failed', { error_reason: errorMessage });
      
      // Update job to completed to prevent BullMQ from locking, but marked as failed in DB
      await updateJobStatus(dbJobId, 'failed', {
        last_error: errorMessage,
        attempts: job.attemptsMade + 1,
      });
    } else {
      // Sync intermediate failure back to DB 
      await updateJobStatus(dbJobId, 'queued', {
        last_error: errorMessage,
        attempts: job.attemptsMade + 1,
      });
    }

    throw error; // Let BullMQ handle retry
  }
}

// ── Initialize the Worker ───────────────────────────────────────────
const worker = new Worker(REPORT_QUEUE_NAME, processReportJob, {
  connection: redis as any,
  concurrency: CONCURRENCY,
  lockDuration: 300_000, // 5min — safe ceiling for AI + PDF gen
});

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    const { jobId: dbJobId, agencyId, reportId } = job.data;
    
    logger.error({ jobId: job.id, dbJobId, err: err.message }, 'Worker: Job permanently failed');

    try {
      await moveToDLQ(dbJobId, agencyId, err.message, err.stack, {
        reportId,
        jobType: 'generate_report',
        attempts: job.attemptsMade,
      });
    } catch (dlqErr: any) {
      logger.error({ dlqErr: dlqErr.message }, 'Worker: Failed to move job to DLQ');
    }
  }
});

logger.info({ 
  concurrency: CONCURRENCY,
  queue: REPORT_QUEUE_NAME,
  memoryThresholdMB: MEMORY_THRESHOLD_MB,
}, 'Worker: BullMQ worker daemon started');

// ── Graceful Shutdown ───────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info({ signal }, `Worker: Received ${signal}, closing worker pool...`);
  await worker.close();
  await closeBrowser(); // Close the Puppeteer singleton to prevent orphaned Chrome
  logger.info('Worker: Pool + browser closed, exiting');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Worker: Unhandled Rejection'));
process.on('uncaughtException', (err) => logger.error({ err }, 'Worker: Uncaught Exception'));
