import { ReportlyError } from '@/types/errors';

/**
 * Convert a Supabase error into a ReportlyError.
 * Never let raw Supabase errors propagate to service/API layers.
 *
 * @param error - The error from Supabase
 * @param context - Human-readable description of the operation (e.g., 'getClientById')
 */
export function handleDbError(error: any, context: string): never {
  const msg = error?.message || (error instanceof Error ? error.message : 'Unknown DB error');
  const code = error?.code || 'DB_ERROR';
  
  throw new ReportlyError(
    'DB_ERROR',
    `[${context}] ${msg} (${code})`,
    'A database error occurred. Please try again.',
    500,
    { context, originalError: error }
  );
}
