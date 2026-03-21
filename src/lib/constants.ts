/**
 * All magic numbers and configuration constants for Reportly.
 * Never use inline magic numbers — always reference this file.
 */

export const DATA_FRESHNESS = {
  GA4_MAX_AGE_HOURS: 48,
  META_MAX_AGE_HOURS: 72,
  STALE_THRESHOLD_HOURS: 168, // 7 days — do not use at all
} as const;

export const VALIDATION = {
  SPIKE_THRESHOLD_PERCENT: 300,
  MIN_METRICS_REQUIRED_RATIO: 0.5, // 50% must be valid to proceed
  MAX_NARRATIVE_LENGTH: 10000,
  MAX_EDIT_LENGTH: 10000,
  ZERO_ANOMALY_MIN_PRIOR: 100, // if prior > this and current == 0, flag unreliable
} as const;

export const RETRY = {
  API_MAX_ATTEMPTS: 3,
  AI_MAX_ATTEMPTS: 2,
  EMAIL_MAX_ATTEMPTS: 3,
  RATE_LIMIT_MIN_WAIT_MS: 60_000, // Hard rule: never retry immediately after 429
  BASE_DELAY_MS: 1_000,
  MAX_DELAY_MS: 300_000,
} as const;

export const QUEUE = {
  MAX_DELAY_HOURS: 6,
  MIN_DELAY_HOURS: 0,
  BATCH_SIZE: 10,
  MONTHLY_RANDOM_DELAY_MAX_MS: 6 * 60 * 60 * 1_000, // 0–6 hours
} as const;

export const REPORT = {
  PDF_MAX_SIZE_BYTES: 5 * 1_024 * 1_024, // 5MB
  AI_TIMEOUT_MS: 30_000, // 30 seconds — fallback activates on timeout
  PDF_TIMEOUT_MS: 25_000, // 25 seconds — kill before Railway limit
  PROMPT_VERSION: 'v1.0',
  TEMPLATE_VERSION: '1.0',
  LOGIC_VERSION: '1.0',
} as const;

export const RATE_LIMITS = {
  LOGIN_MAX: 5,
  LOGIN_WINDOW: '15m',
  REGISTER_MAX: 3,
  REGISTER_WINDOW: '1h',
  OAUTH_MAX: 10,
  OAUTH_WINDOW: '1h',
  REPORT_TRIGGER_MAX: 20,
  REPORT_TRIGGER_WINDOW: '1h',
  API_GENERAL_MAX: 100,
  API_GENERAL_WINDOW: '1m',
  ADMIN_MAX: 30,
  ADMIN_WINDOW: '1m',
} as const;

export const GA4 = {
  DAILY_REQUEST_LIMIT: 8_000, // keep 2k buffer below 10k quota
  MIN_SYNC_GAP_HOURS: 23, // per-client cooldown
} as const;

export const CIRCUIT_BREAKER = {
  GA4_THRESHOLD: 5,
  GA4_RESET_MS: 60_000,
  META_THRESHOLD: 5,
  META_RESET_MS: 60_000,
  AI_THRESHOLD: 3,
  AI_RESET_MS: 30_000,
  EMAIL_THRESHOLD: 3,
  EMAIL_RESET_MS: 120_000,
} as const;

export const AUTH = {
  SESSION_DURATION_DAYS: 7,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  MIN_PASSWORD_LENGTH: 12,
} as const;

export const FEATURE_FLAGS = {
  AI_NARRATIVE: 'ai-narrative',
  EMAIL_DELIVERY: 'email-delivery',
  META_INTEGRATION: 'meta-integration',
  PDF_CHARTS: 'pdf-charts',
  ADMIN_PANEL: 'admin-panel',
} as const;
