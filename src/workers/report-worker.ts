import { getJobsByStatus, updateJobStatus } from '@/lib/db/repositories/jobRepo';
import { runReportGeneration } from '@/lib/services/reportService';
import { logger } from '@/lib/utils/logger';

/**
 * Poor man's worker: Polls the job_queue for 'queued' jobs and processes them.
 * In production, this would be a separate process or a robust queue like BullMQ.
 */
export async function pollAndProcessJobs() {
  try {
    const jobs = await getJobsByStatus('queued', 5);
    
    if (jobs.length === 0) return;

    logger.info({ count: jobs.length }, 'Worker: Picking up jobs');

    for (const job of jobs) {
      if (job.job_type !== 'generate_report') continue;

      try {
        const { periodStart, periodEnd } = job.payload as any;
        
        await runReportGeneration(
          job.client_id!,
          job.agency_id,
          {
            start: new Date(periodStart),
            end: new Date(periodEnd),
            label: 'Custom'
          },
          job.report_id!,
          job.id
        );

        logger.info({ jobId: job.id, reportId: job.report_id }, 'Worker: Job Completed');
      } catch (error: any) {
        logger.error({ jobId: job.id, err: error.message }, 'Worker: Job Failed');
        // Status update to 'failed' is handled inside runReportGeneration catch block
      }
    }
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
