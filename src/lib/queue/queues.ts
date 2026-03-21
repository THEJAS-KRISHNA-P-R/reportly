import { Queue } from 'bullmq';
import { redisConnection } from './redis';
import { JobType } from '@/types/job';

export const reportQueue = new Queue<any, any, string>('report-queue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
