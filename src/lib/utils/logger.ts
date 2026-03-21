import pino from 'pino';

/**
 * Structured logger with automatic redaction of sensitive fields.
 * Never log raw tokens, passwords, or keys.
 * Use this logger everywhere — never use console.log directly.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      '*.token',
      '*.key',
      '*.secret',
      '*.password',
      '*.authorization',
      '*.access_token',
      '*.refresh_token',
      '*.access_token_enc',
      '*.refresh_token_enc',
      'token',
      'key',
      'secret',
      'password',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

/**
 * Safe token display: show only first 8 chars for debugging.
 * Use this instead of ever logging a full token.
 */
export function safeToken(token: string): string {
  return token.slice(0, 8) + '...';
}
