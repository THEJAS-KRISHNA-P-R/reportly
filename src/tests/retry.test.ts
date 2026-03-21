import { withRetry } from '@/lib/utils/retry';
import { ReportlyError } from '@/types/errors';
import { RETRY } from '@/lib/constants';

jest.mock('@/lib/utils/sleep', () => ({
  sleep: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    let attempts = 0;
    const op = jest.fn().mockImplementation(async () => {
      attempts++;
      return 'success';
    });

    const result = await withRetry(op, 'api');
    expect(result).toBe('success');
    expect(attempts).toBe(1);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on generic failure and eventually succeeds', async () => {
    let attempts = 0;
    const op = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Temporary glitch');
      return 'success';
    });

    const result = await withRetry(op, 'api');
    expect(result).toBe('success');
    expect(attempts).toBe(3);
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('fails fast on UNAUTHORIZED without retrying', async () => {
    const op = jest.fn().mockImplementation(async () => {
      throw new ReportlyError('UNAUTHORIZED', 'session expired', 'Login again', 401);
    });

    await expect(withRetry(op, 'api')).rejects.toThrow(ReportlyError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('throws API_FETCH_FAILED after max attempts', async () => {
    const op = jest.fn().mockImplementation(async () => {
      throw new Error('Persistent failure');
    });

    await expect(withRetry(op, 'api')).rejects.toThrow('Failed to execute operation after 3 attempts');
    expect(op).toHaveBeenCalledTimes(RETRY.API_MAX_ATTEMPTS);
  });
});
