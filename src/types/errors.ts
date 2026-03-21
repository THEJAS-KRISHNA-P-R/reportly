/**
 * Reportly custom error class.
 * All thrown errors in the application must use this class.
 * Never throw raw strings or generic Error instances.
 */
export class ReportlyError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ReportlyError';
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper prototype chain in TypeScript
    Object.setPrototypeOf(this, ReportlyError.prototype);
  }

  static forbidden(message: string = 'Access denied', userMessage: string = 'You do not have permission to perform this action.'): ReportlyError {
    return new ReportlyError('FORBIDDEN', message, userMessage, 403);
  }

  static unauthorized(message: string = 'Unauthorized', userMessage: string = 'Please log in to continue.'): ReportlyError {
    return new ReportlyError('UNAUTHORIZED', message, userMessage, 401);
  }

  toJSON() {
    return {
      error: this.userMessage,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DB_ERROR'
  | 'OAUTH_CSRF'
  | 'OAUTH_FAILED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REFRESH_FAILED'
  | 'API_FETCH_FAILED'
  | 'RATE_LIMITED'
  | 'CIRCUIT_OPEN'
  | 'AI_FAILED'
  | 'FALLBACK_FAILED'
  | 'PDF_FAILED'
  | 'EMAIL_FAILED'
  | 'PIPELINE_CRITICAL_FAILURE'
  | 'UNSUPPORTED_PLATFORM'
  | 'INVALID_RECIPIENTS'
  | 'REPORT_CONFLICT';
