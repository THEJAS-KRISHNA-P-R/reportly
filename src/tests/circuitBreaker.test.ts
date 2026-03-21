import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { ReportlyError } from '@/types/errors';
import { CIRCUIT_BREAKER } from '@/lib/constants';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

describe('CircuitBreaker', () => {
  beforeEach(() => {
    CircuitBreaker.reset('ga4');
  });

  it('executes successfully when closed', async () => {
    const op = jest.fn().mockResolvedValue('data');
    const result = await CircuitBreaker.execute('ga4', op);
    expect(result).toBe('data');
  });

  it('opens after reaching threshold and prevents execution', async () => {
    // Override the mock to reject always
    const op = jest.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < CIRCUIT_BREAKER.GA4_THRESHOLD; i++) {
      await expect(CircuitBreaker.execute('ga4', op)).rejects.toThrow('fail');
    }

    // Now it should be OPEN, and should throw CIRCUIT_OPEN even without invoking op
    const opNotCalled = jest.fn();
    await expect(CircuitBreaker.execute('ga4', opNotCalled)).rejects.toThrow(ReportlyError);
    expect(opNotCalled).not.toHaveBeenCalled();
  });
});
