import { Queue, DefaultJobOptions } from 'bullmq';
import { redis } from '../redis';

export const REPORT_QUEUE_NAME = 'report-generation';

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep logs for 24h
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
  },
};

export const reportQueue = new Queue(REPORT_QUEUE_NAME, {
  connection: redis as any,
  defaultJobOptions,
});
