import { RETRY } from '@/lib/constants';
import { sleep } from './sleep';
import { ReportlyError } from '@/types/errors';
import { logger } from './logger';

export type RetryProfile = 'api' | 'ai' | 'email';

export async function withRetry<T>(
  operation: () => Promise<T>,
  profile: RetryProfile,
  context: string = 'operation'
): Promise<T> {
  let maxAttempts: number = RETRY.API_MAX_ATTEMPTS;
  if (profile === 'ai') maxAttempts = RETRY.AI_MAX_ATTEMPTS;
  if (profile === 'email') maxAttempts = RETRY.EMAIL_MAX_ATTEMPTS;

  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error: any) {
      // Fast fail on fatal errors that shouldn't be retried
      if (error instanceof ReportlyError) {
        if (
          error.code === 'UNAUTHORIZED' ||
          error.code === 'FORBIDDEN' ||
          error.code === 'NOT_FOUND' ||
          error.code === 'VALIDATION_ERROR' ||
          error.code === 'OAUTH_FAILED' ||
          error.code === 'CIRCUIT_OPEN'
        ) {
          throw error;
        }
      }

      // Handle HTTP 429 Rate Limits explicitly
      const status = error?.status || error?.response?.status;
      if (status === 429) {
        logger.warn({ attempt, context }, `Rate limit hit, waiting ${RETRY.RATE_LIMIT_MIN_WAIT_MS}ms`);
        await sleep(RETRY.RATE_LIMIT_MIN_WAIT_MS);
      } else {
        const delayMs = Math.min(RETRY.BASE_DELAY_MS * Math.pow(2, attempt - 1), RETRY.MAX_DELAY_MS);
        logger.warn({ attempt, context, error: error.message }, `Retrying in ${delayMs}ms`);
        await sleep(delayMs);
      }

      if (attempt === maxAttempts) {
        logger.error({ context, maxAttempts, error: error.message }, `Max retries reached`);
        if (error instanceof ReportlyError) throw error;
        throw new ReportlyError(
          'API_FETCH_FAILED',
          `Failed to execute ${context} after ${maxAttempts} attempts: ${error.message}`,
          `We encountered a temporary issue while connecting to the service. Please try again later.`,
          503,
          { profile, originalError: error.message }
        );
      }
      attempt++;
    }
  }

  throw new Error('Unreachable code hit in withRetry');
}
