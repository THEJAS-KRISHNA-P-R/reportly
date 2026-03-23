import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

const FALLBACK_REQUEST_ID_HEADER = 'x-request-id';
const MAX_CORRELATION_ID_LENGTH = 128;
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

export function normalizeCorrelationId(rawValue?: string | null): string | undefined {
  if (!rawValue) return undefined;

  const trimmed = rawValue.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_CORRELATION_ID_LENGTH) {
    return undefined;
  }

  if (!CORRELATION_ID_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function getCorrelationIdFromHeaders(headers: Headers): string | undefined {
  return (
    normalizeCorrelationId(headers.get(CORRELATION_ID_HEADER)) ??
    normalizeCorrelationId(headers.get(FALLBACK_REQUEST_ID_HEADER))
  );
}

export function resolveCorrelationId(request: Request): string {
  return getCorrelationIdFromHeaders(request.headers) ?? randomUUID();
}

export function buildSystemCorrelationId(source: string): string {
  const normalizedSource = source.trim().replace(/[^A-Za-z0-9._:-]/g, '-').slice(0, 48) || 'system';
  return `${normalizedSource}:${randomUUID()}`;
}

export function withCorrelationHeader(correlationId: string): HeadersInit {
  return {
    [CORRELATION_ID_HEADER]: correlationId,
  };
}

export function getPayloadCorrelationId(payload: Record<string, unknown>): string | undefined {
  return normalizeCorrelationId(typeof payload.correlationId === 'string' ? payload.correlationId : undefined);
}
