import {
  claimQueuedJobForProcessing,
  getJobsByStatus,
  heartbeatProcessingLease,
  moveToDLQ,
  requeueStaleProcessingJobs,
  updateJobStatus,
} from '@/lib/db/repositories/jobRepo';
import { runReportGeneration } from '@/lib/services/reportService';
import { logger } from '@/lib/utils/logger';
import type { ReportPeriod } from '@/types/adapters';
import { randomUUID } from 'crypto';
import { buildSystemCorrelationId, getPayloadCorrelationId } from '@/lib/observability/correlation';

const WORKER_LEASE_TIMEOUT_MS = Math.max(60_000, Number(process.env.WORKER_LEASE_TIMEOUT_MS ?? 10 * 60_000));
const WORKER_HEARTBEAT_MS = Math.max(10_000, Number(process.env.WORKER_HEARTBEAT_MS ?? Math.floor(WORKER_LEASE_TIMEOUT_MS / 3)));

function computeRetryDelayMs(attemptNumber: number): number {
  const baseDelayMs = 30_000;
  const maxDelayMs = 5 * 60_000;
  return Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.max(0, attemptNumber - 1)));
}

function parseReportPeriod(payload: Record<string, unknown>): ReportPeriod {
  const periodStart = payload.periodStart;
  const periodEnd = payload.periodEnd;
  const label = typeof payload.label === 'string' ? payload.label : 'Custom';

  if (typeof periodStart !== 'string' || typeof periodEnd !== 'string') {
    throw new Error('Job payload missing periodStart/periodEnd');
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Job payload has invalid date range');
  }

  return { start, end, label };
}

/**
 * Poor man's worker: Polls the job_queue for 'queued' jobs and processes them.
 * In production, this would be a separate process or a robust queue like BullMQ.
 */
export async function pollAndProcessJobs() {
  try {
    const concurrency = Math.max(1, Number(process.env.WORKER_CONCURRENCY ?? 5));

    const recoveredStaleJobs = await requeueStaleProcessingJobs(WORKER_LEASE_TIMEOUT_MS, concurrency * 4);
    if (recoveredStaleJobs > 0) {
      logger.warn({ recoveredStaleJobs }, 'Worker: Requeued stale processing jobs after lease timeout');
    }

    const jobs = await getJobsByStatus('queued', concurrency);
    
    if (jobs.length === 0) return;

    logger.info({ count: jobs.length }, 'Worker: Picking up jobs');

    await Promise.all(jobs.map(async (job) => {
      if (job.job_type !== 'generate_report') return;

      const attemptNumber = Math.max(1, (job.attempts ?? 0) + 1);
      const maxAttempts = Math.max(1, job.max_attempts ?? 3);
      const startedAt = new Date().toISOString();
      const leaseOwnerToken = `worker:${process.pid}:${randomUUID()}`;

      const claimed = await claimQueuedJobForProcessing(job.id, attemptNumber, startedAt, leaseOwnerToken);
      if (!claimed) {
        logger.info({ jobId: job.id }, 'Worker: Job already claimed by another worker');
        return;
      }

      let leaseLost = false;
      let heartbeatInFlight = false;
      const heartbeatTimer = setInterval(async () => {
        if (heartbeatInFlight || leaseLost) {
          return;
        }

        heartbeatInFlight = true;
        try {
          const renewed = await heartbeatProcessingLease(job.id, leaseOwnerToken, new Date().toISOString());
          if (!renewed) {
            leaseLost = true;
            logger.error({ jobId: job.id }, 'Worker: Lease heartbeat failed, ownership lost');
          }
        } catch (heartbeatError: any) {
          logger.error({ jobId: job.id, err: heartbeatError?.message ?? 'unknown' }, 'Worker: Lease heartbeat error');
        } finally {
          heartbeatInFlight = false;
        }
      }, WORKER_HEARTBEAT_MS);

      try {
        if (!job.client_id || !job.report_id) {
          throw new Error('Generate-report job is missing client_id or report_id');
        }

        const payload = (job.payload ?? {}) as Record<string, unknown>;
        const period = parseReportPeriod(payload);
        const runKey = typeof payload.runKey === 'string' ? payload.runKey : undefined;
        const idempotencyKey = typeof payload.idempotencyKey === 'string' ? payload.idempotencyKey : undefined;
        const correlationId = getPayloadCorrelationId(payload) ?? buildSystemCorrelationId(`job.${job.id}`);
        
        await runReportGeneration(
          job.client_id,
          job.agency_id,
          period,
          job.report_id,
          job.id,
          {
            attempt: attemptNumber,
            runKey,
            idempotencyKey,
            jobLeaseOwnerToken: leaseOwnerToken,
            correlationId,
          }
        );

        if (leaseLost) {
          throw new Error('Lease ownership lost before completion acknowledgement');
        }

        logger.info(
          { jobId: job.id, reportId: job.report_id, attempt: attemptNumber, correlationId },
          'Worker: Job completed'
        );
      } catch (error: any) {
        const errorMessage = error?.message ?? 'Unknown worker error';
        const stackTrace = error?.stack ? String(error.stack) : undefined;
        const correlationId = getPayloadCorrelationId((job.payload ?? {}) as Record<string, unknown>);

        if (leaseLost) {
          logger.warn(
            { jobId: job.id, attempt: attemptNumber, correlationId, err: errorMessage },
            'Worker: Lease lost during processing; skipping retry/DLQ mutation'
          );
          return;
        }

        if (attemptNumber < maxAttempts) {
          const retryAt = new Date(Date.now() + computeRetryDelayMs(attemptNumber));

          await updateJobStatus(job.id, 'queued', {
            attempts: attemptNumber,
            last_error: errorMessage,
            started_at: null,
            completed_at: null,
            bull_job_id: null,
            scheduled_for: retryAt.toISOString(),
          }, {
            leaseOwnerToken,
            expectedCurrentStatus: 'processing',
          });

          logger.warn(
            {
              jobId: job.id,
              attempt: attemptNumber,
              maxAttempts,
              retryAt: retryAt.toISOString(),
              correlationId,
              err: errorMessage,
            },
            'Worker: Job failed and was re-queued'
          );
          return;
        }

        await moveToDLQ(job.id, job.agency_id, errorMessage, stackTrace, {
          reportId: job.report_id,
          attempts: attemptNumber,
          maxAttempts,
          jobType: job.job_type,
        });

        logger.error(
          { jobId: job.id, attempt: attemptNumber, maxAttempts, correlationId, err: errorMessage },
          'Worker: Job exhausted retries and was moved to DLQ'
        );
      } finally {
        clearInterval(heartbeatTimer);
      }
    }));
  } catch (error: any) {
    logger.error({ err: error.message }, 'Worker: Polling Error');
  }
}

// If run via CLI
if (require.main === module) {
    logger.info('Worker: Starting manual poll cycle');
    pollAndProcessJobs().then(() => {
        logger.info('Worker: Cycle finished');
        process.exit(0);
    });
}
