import { ReportlyError } from '@/types/errors';

export function getPreviousPeriod(currentStart: Date, currentEnd: Date): { start: Date; end: Date } {
  if (currentStart >= currentEnd) {
    throw new ReportlyError('VALIDATION_ERROR', 'Start date must be before end date', 'Invalid report period.');
  }

  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  // If calculating month, we should ideally use calendar months, but for MVP strict duration is safer.
  const previousStart = new Date(currentStart.getTime() - durationMs - ONE_DAY_MS);
  const previousEnd = new Date(currentStart.getTime() - ONE_DAY_MS);

  return { start: previousStart, end: previousEnd };
}

export function formatPeriod(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}
