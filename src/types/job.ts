export type JobType = 'fetch_data' | 'generate_report' | 'send_email' | 'token_refresh';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'dlq' | 'cancelled';

export interface Job {
  id: string;
  bull_job_id: string | null;
  job_type: JobType;
  agency_id: string;
  client_id: string | null;
  report_id: string | null;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  job_type: JobType;
  agency_id: string;
  client_id?: string;
  report_id?: string;
  payload?: Record<string, unknown>;
  scheduled_for?: Date;
}

export interface DLQEntry {
  id: string;
  job_id: string;
  agency_id: string;
  error_message: string | null;
  stack_trace: string | null;
  context: Record<string, unknown> | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}
