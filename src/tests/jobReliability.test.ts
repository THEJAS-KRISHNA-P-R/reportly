import {
  buildReportIdempotencyKey,
  buildReportJobIdentity,
  normalizeRunKey,
} from '@/lib/db/repositories/jobRepo';

describe('job reliability idempotency helpers', () => {
  it('normalizes empty run keys to default', () => {
    expect(normalizeRunKey(undefined)).toBe('default');
    expect(normalizeRunKey('')).toBe('default');
    expect(normalizeRunKey('   ')).toBe('default');
  });

  it('preserves explicit run keys', () => {
    expect(normalizeRunKey('monthly-rollup')).toBe('monthly-rollup');
    expect(normalizeRunKey('  rerun-42  ')).toBe('rerun-42');
  });

  it('builds deterministic idempotency keys for same logical run', () => {
    const first = buildReportJobIdentity({
      clientId: 'client-1',
      periodStartIso: '2026-03-01T00:00:00.000Z',
      periodEndIso: '2026-03-31T23:59:59.999Z',
      runKey: 'monthly',
    });

    const second = buildReportJobIdentity({
      clientId: 'client-1',
      periodStartIso: '2026-03-01T00:00:00.000Z',
      periodEndIso: '2026-03-31T23:59:59.999Z',
      runKey: 'monthly',
    });

    expect(buildReportIdempotencyKey(first)).toBe(buildReportIdempotencyKey(second));
  });

  it('changes idempotency key when run key differs', () => {
    const base = buildReportJobIdentity({
      clientId: 'client-1',
      periodStartIso: '2026-03-01T00:00:00.000Z',
      periodEndIso: '2026-03-31T23:59:59.999Z',
      runKey: 'monthly',
    });

    const rerun = buildReportJobIdentity({
      clientId: 'client-1',
      periodStartIso: '2026-03-01T00:00:00.000Z',
      periodEndIso: '2026-03-31T23:59:59.999Z',
      runKey: 'manual-rerun',
    });

    expect(buildReportIdempotencyKey(base)).not.toBe(buildReportIdempotencyKey(rerun));
  });
});
