import { createSupabaseServiceClient } from '@/lib/db/client';
import type { Job, CreateJobInput, DLQEntry, ReportJobIdentity } from '@/types/job';
import { handleDbError } from './_base';

const DEFAULT_RUN_KEY = 'default';
const IDEMPOTENCY_VERSION = 'v1';

function normalizeIsoDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ISO date value: ${value}`);
  }
  return parsed.toISOString();
}

export function normalizeRunKey(runKey?: string): string {
  const normalized = runKey?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_RUN_KEY;
}

export function buildReportJobIdentity(input: {
  clientId: string;
  periodStartIso: string;
  periodEndIso: string;
  runKey?: string;
}): ReportJobIdentity {
  return {
    clientId: input.clientId,
    periodStartIso: normalizeIsoDate(input.periodStartIso),
    periodEndIso: normalizeIsoDate(input.periodEndIso),
    runKey: normalizeRunKey(input.runKey),
  };
}

export function buildReportIdempotencyKey(identity: ReportJobIdentity): string {
  return [
    'report',
    IDEMPOTENCY_VERSION,
    identity.clientId,
    identity.periodStartIso,
    identity.periodEndIso,
    identity.runKey,
  ].join(':');
}

function extractReportJobIdentity(input: CreateJobInput): ReportJobIdentity | null {
  if (input.job_type !== 'generate_report' || !input.client_id) {
    return null;
  }

  const payload = (input.payload ?? {}) as Record<string, unknown>;
  const periodStartRaw = payload.periodStart;
  const periodEndRaw = payload.periodEnd;

  if (typeof periodStartRaw !== 'string' || typeof periodEndRaw !== 'string') {
    return null;
  }

  return buildReportJobIdentity({
    clientId: input.client_id,
    periodStartIso: periodStartRaw,
    periodEndIso: periodEndRaw,
    runKey: input.run_key ?? (typeof payload.runKey === 'string' ? payload.runKey : undefined),
  });
}

function withIdempotencyMetadata(
  input: CreateJobInput,
  identity: ReportJobIdentity | null
): Record<string, unknown> {
  const payload = { ...(input.payload ?? {}) } as Record<string, unknown>;

  if (!identity) {
    return payload;
  }

  payload.runKey = identity.runKey;
  payload.idempotencyKey = buildReportIdempotencyKey(identity);
  payload.periodStart = identity.periodStartIso;
  payload.periodEnd = identity.periodEndIso;

  return payload;
}

async function getJobByIdempotencyKey(
  clientId: string,
  idempotencyKey: string
): Promise<Job | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .select('*')
    .eq('job_type', 'generate_report')
    .eq('client_id', clientId)
    .in('status', ['queued', 'processing', 'completed'])
    .eq('payload->>idempotencyKey', idempotencyKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) handleDbError(error, 'getJobByIdempotencyKey');
  return (data as Job | null) ?? null;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const db = createSupabaseServiceClient();
  const identity = extractReportJobIdentity(input);
  const payload = withIdempotencyMetadata(input, identity);

  if (identity) {
    const idempotencyKey = String(payload.idempotencyKey);
    const existingJob = await getJobByIdempotencyKey(identity.clientId, idempotencyKey);
    if (existingJob) {
      return existingJob;
    }
  }

  const { data, error } = await db
    .from('job_queue')
    .insert({
      job_type: input.job_type,
      agency_id: input.agency_id,
      client_id: input.client_id ?? null,
      report_id: input.report_id ?? null,
      payload,
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
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from('job_queue')
    .select('*')
    .eq('status', status)
    .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) handleDbError(error, 'getJobsByStatus');
  return (data ?? []) as Job[];
}

export async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  extra?: Partial<
    Pick<Job, 'last_error' | 'bull_job_id' | 'started_at' | 'completed_at' | 'attempts' | 'scheduled_for'>
  >,
  options?: {
    leaseOwnerToken?: string;
    expectedCurrentStatus?: Job['status'];
  }
): Promise<void> {
  const db = createSupabaseServiceClient();
  let query = db
    .from('job_queue')
    .update({ status, ...extra })
    .eq('id', jobId);

  if (options?.leaseOwnerToken) {
    query = query.eq('bull_job_id', options.leaseOwnerToken);
  }

  if (options?.expectedCurrentStatus) {
    query = query.eq('status', options.expectedCurrentStatus);
  }

  const { error } = await query;
  if (error) handleDbError(error, 'updateJobStatus');
}

/**
 * Atomically claim a queued job for processing to avoid duplicate work across workers.
 * Returns true only if this worker successfully transitioned the job from queued -> processing.
 */
export async function claimQueuedJobForProcessing(
  jobId: string,
  attempt: number,
  startedAtIso: string,
  leaseOwnerToken: string
): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .update({
      status: 'processing',
      attempts: attempt,
      started_at: startedAtIso,
      completed_at: null,
      bull_job_id: leaseOwnerToken,
      last_error: null,
    })
    .eq('id', jobId)
    .eq('status', 'queued')
    .select('id')
    .maybeSingle();

  if (error) handleDbError(error, 'claimQueuedJobForProcessing');
  return !!data;
}

/**
 * Refreshes a processing lease heartbeat.
 * Returns false if lease ownership was lost.
 */
export async function heartbeatProcessingLease(
  jobId: string,
  leaseOwnerToken: string,
  heartbeatAtIso: string
): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('job_queue')
    .update({ started_at: heartbeatAtIso })
    .eq('id', jobId)
    .eq('status', 'processing')
    .eq('bull_job_id', leaseOwnerToken)
    .select('id')
    .maybeSingle();

  if (error) handleDbError(error, 'heartbeatProcessingLease');
  return !!data;
}

/**
 * Requeues stale processing jobs whose lease heartbeat timed out.
 */
export async function requeueStaleProcessingJobs(
  leaseTimeoutMs: number,
  limit = 100
): Promise<number> {
  const db = createSupabaseServiceClient();
  const cutoffIso = new Date(Date.now() - leaseTimeoutMs).toISOString();
  const nowIso = new Date().toISOString();

  const { data: staleJobs, error: selectError } = await db
    .from('job_queue')
    .select('id,last_error')
    .eq('status', 'processing')
    .lt('started_at', cutoffIso)
    .order('started_at', { ascending: true })
    .limit(limit);

  if (selectError) handleDbError(selectError, 'requeueStaleProcessingJobs.select');
  if (!staleJobs || staleJobs.length === 0) return 0;

  let recoveredCount = 0;
  for (const staleJob of staleJobs) {
    const nextError = staleJob.last_error
      ? `${staleJob.last_error} | lease_timeout_recovered_at=${nowIso}`
      : `lease_timeout_recovered_at=${nowIso}`;

    const { data: updated, error: updateError } = await db
      .from('job_queue')
      .update({
        status: 'queued',
        started_at: null,
        completed_at: null,
        bull_job_id: null,
        last_error: nextError.slice(0, 1000),
        scheduled_for: nowIso,
      })
      .eq('id', staleJob.id)
      .eq('status', 'processing')
      .select('id')
      .maybeSingle();

    if (updateError) handleDbError(updateError, 'requeueStaleProcessingJobs.update');
    if (updated) {
      recoveredCount += 1;
    }
  }

  return recoveredCount;
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
