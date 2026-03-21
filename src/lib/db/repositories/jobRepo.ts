import { createSupabaseServiceClient } from '@/lib/db/client';
import type { Job, CreateJobInput, DLQEntry } from '@/types/job';
import { handleDbError } from './_base';

export async function createJob(input: CreateJobInput): Promise<Job> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .insert({
      job_type: input.job_type,
      agency_id: input.agency_id,
      client_id: input.client_id ?? null,
      report_id: input.report_id ?? null,
      payload: input.payload ?? {},
      status: 'queued',
      scheduled_for: input.scheduled_for?.toISOString() ?? null,
    })
    .select()
    .single();
  if (error) handleDbError(error, 'createJob');
  return data as Job;
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) return null;
  return data as Job | null;
}

export async function getJobsByStatus(status: Job['status'], limit = 50): Promise<Job[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) handleDbError(error, 'getJobsByStatus');
  return (data ?? []) as Job[];
}

export async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  extra?: Partial<Pick<Job, 'last_error' | 'bull_job_id' | 'started_at' | 'completed_at' | 'attempts'>>
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('job_queue')
    .update({ status, ...extra })
    .eq('id', jobId);
  if (error) handleDbError(error, 'updateJobStatus');
}

export async function getDLQEntries(limit = 50): Promise<DLQEntry[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('dead_letter_queue')
    .select('*')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) handleDbError(error, 'getDLQEntries');
  return (data ?? []) as DLQEntry[];
}

export async function moveToDLQ(
  jobId: string,
  agencyId: string,
  errorMessage: string,
  stackTrace?: string,
  context?: Record<string, unknown>
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db.from('dead_letter_queue').insert({
    job_id: jobId,
    agency_id: agencyId,
    error_message: errorMessage.slice(0, 1000),
    stack_trace: stackTrace?.slice(0, 5000) ?? null,
    context: context ?? null,
  });
  if (error) handleDbError(error, 'moveToDLQ');
  // Also update job status
  await updateJobStatus(jobId, 'dlq');
}

export async function resolveDLQEntry(entryId: string, resolvedBy: string, note?: string): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('dead_letter_queue')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      resolution_note: note ?? null,
    })
    .eq('id', entryId);
  if (error) handleDbError(error, 'resolveDLQEntry');
}
