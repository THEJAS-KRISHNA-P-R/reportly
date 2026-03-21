import { CIRCUIT_BREAKER } from '@/lib/constants';
import { ReportlyError } from '@/types/errors';
import { logger } from './logger';

export type ServiceName = 'ga4' | 'meta' | 'ai' | 'email';

interface BreakerState {
  failures: number;
  lastFailureAt: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const breakers = new Map<ServiceName, BreakerState>();

function getBreaker(service: ServiceName): BreakerState {
  if (!breakers.has(service)) {
    breakers.set(service, { failures: 0, lastFailureAt: null, state: 'CLOSED' });
  }
  return breakers.get(service)!;
}

function getConfig(service: ServiceName) {
  switch (service) {
    case 'ga4': return { threshold: CIRCUIT_BREAKER.GA4_THRESHOLD, resetMs: CIRCUIT_BREAKER.GA4_RESET_MS };
    case 'meta': return { threshold: CIRCUIT_BREAKER.META_THRESHOLD, resetMs: CIRCUIT_BREAKER.META_RESET_MS };
    case 'ai': return { threshold: CIRCUIT_BREAKER.AI_THRESHOLD, resetMs: CIRCUIT_BREAKER.AI_RESET_MS };
    case 'email': return { threshold: CIRCUIT_BREAKER.EMAIL_THRESHOLD, resetMs: CIRCUIT_BREAKER.EMAIL_RESET_MS };
    default: return { threshold: 5, resetMs: 60000 };
  }
}

export class CircuitBreaker {
  static async execute<T>(service: ServiceName, operation: () => Promise<T>): Promise<T> {
    const breaker = getBreaker(service);
    const config = getConfig(service);

    const now = Date.now();

    if (breaker.state === 'OPEN') {
      if (breaker.lastFailureAt && now - breaker.lastFailureAt > config.resetMs) {
        // Transitional state to test recovery
        breaker.state = 'HALF_OPEN';
        logger.info({ service }, 'Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new ReportlyError('CIRCUIT_OPEN', `Circuit open for ${service}`, 'Service temporarily unavailable', 503);
      }
    }

    try {
      const result = await operation();
      // Success resets the breaker
      if (breaker.state === 'HALF_OPEN' || breaker.failures > 0) {
        breaker.failures = 0;
        breaker.state = 'CLOSED';
        breaker.lastFailureAt = null;
        logger.info({ service }, 'Circuit breaker reset to CLOSED after successful execution');
      }
      return result;
    } catch (error: any) {
      breaker.failures++;
      breaker.lastFailureAt = Date.now();

      if (breaker.state === 'HALF_OPEN' || breaker.failures >= config.threshold) {
        breaker.state = 'OPEN';
        logger.error({ service, failures: breaker.failures }, 'Circuit breaker OPENED');
      }

      throw error;
    }
  }

  static reset(service: ServiceName): void {
    breakers.set(service, { failures: 0, lastFailureAt: null, state: 'CLOSED' });
    logger.info({ service }, 'Circuit breaker manual reset');
  }
}
