import { Worker, Job } from 'bullmq';
import { redisConnection } from './redis';
import { runReportGeneration } from '@/lib/services/reportService';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { logger } from '@/lib/utils/logger';
import { JobType } from '@/types/job';

export const reportWorker = new Worker(
  'report-queue',
  async (job: Job) => {
    const { clientId, agencyId, period } = job.data;
    const jobType = job.name as JobType;

    logger.info({ jobId: job.id, type: jobType, clientId }, 'Processing background job');

    if (jobType === 'generate_report') {
       await runReportGeneration(clientId, agencyId, period);
    }
    
    // Additional job types (fetch_data, send_email) can be added here
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
  }
);

reportWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed successfully');
});

reportWorker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Job failed');
  
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    // Final failure: Log to DLQ (simulated by audit log for now, 
    // or we could use the dlq table if implemented)
    if (job.data.reportId) {
      await createAuditLog(job.data.reportId, job.data.agencyId, 'job_dlq', {
        error: err.message,
        jobId: job.id,
        attempts: job.attemptsMade
      });
    }
  }
});
