import {
  buildSystemCorrelationId,
  getCorrelationIdFromHeaders,
  normalizeCorrelationId,
} from '@/lib/observability/correlation';

describe('correlation helpers', () => {
  it('normalizes valid correlation IDs and rejects malformed values', () => {
    expect(normalizeCorrelationId('trace-123')).toBe('trace-123');
    expect(normalizeCorrelationId('  trace:abc_42  ')).toBe('trace:abc_42');
    expect(normalizeCorrelationId('')).toBeUndefined();
    expect(normalizeCorrelationId('bad value with spaces')).toBeUndefined();
  });

  it('reads correlation id from request headers with fallback', () => {
    const fromPrimary = new Headers({ 'x-correlation-id': 'req-1' });
    const fromFallback = new Headers({ 'x-request-id': 'req-2' });

    expect(getCorrelationIdFromHeaders(fromPrimary)).toBe('req-1');
    expect(getCorrelationIdFromHeaders(fromFallback)).toBe('req-2');
  });

  it('builds system correlation IDs with source prefix', () => {
    const id = buildSystemCorrelationId('scheduler.reports');
    expect(id.startsWith('scheduler.reports:')).toBe(true);
  });
});
