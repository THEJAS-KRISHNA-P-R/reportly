import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { normalizeCorrelationId } from '@/lib/observability/correlation';
import { logger } from '@/lib/utils/logger';
import { apiError, apiOk } from '@/lib/api-contract';

type JobTraceRow = {
  id: string;
  report_id: string | null;
  agency_id: string;
  client_id: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  payload: Record<string, unknown>;
};

type AuditTraceRow = {
  id: string;
  report_id: string;
  agency_id: string;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

async function checkAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return { error: 'Forbidden' as const };
  }

  return { userId: user.id };
}

function buildTimeline(jobs: JobTraceRow[], audits: AuditTraceRow[]) {
  const timeline: Array<Record<string, unknown>> = [];

  for (const job of jobs) {
    timeline.push({
      source: 'job_queue',
      type: 'job_created',
      at: job.created_at,
      jobId: job.id,
      reportId: job.report_id,
      status: job.status,
      attempts: job.attempts,
    });

    if (job.started_at) {
      timeline.push({
        source: 'job_queue',
        type: 'job_started',
        at: job.started_at,
        jobId: job.id,
        reportId: job.report_id,
        status: job.status,
      });
    }

    if (job.completed_at) {
      timeline.push({
        source: 'job_queue',
        type: 'job_finished',
        at: job.completed_at,
        jobId: job.id,
        reportId: job.report_id,
        status: job.status,
      });
    }
  }

  for (const audit of audits) {
    timeline.push({
      source: 'audit_logs',
      type: String(audit.event_type),
      at: audit.created_at,
      auditId: audit.id,
      reportId: audit.report_id,
      pipelineStep:
        typeof audit.payload?.pipelineStep === 'string' ? audit.payload.pipelineStep : null,
      jobId: typeof audit.payload?.jobId === 'string' ? audit.payload.jobId : null,
    });
  }

  return timeline.sort((a, b) => {
    const left = String(a.at ?? '');
    const right = String(b.at ?? '');
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

export async function GET(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return apiError('FORBIDDEN', auth.error ?? 'Forbidden', 403);
  }

  const correlationIdRaw = request.nextUrl.searchParams.get('correlationId');
  const correlationId = normalizeCorrelationId(correlationIdRaw);
  if (!correlationId) {
    return apiError('VALIDATION_ERROR', 'Invalid or missing correlationId. Use ?correlationId=<trace-id>', 400);
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') ?? 100);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(500, Math.floor(requestedLimit)))
    : 100;

  try {
    const db = createSupabaseServiceClient();

    const [{ data: jobs, error: jobsError }, { data: audits, error: auditsError }] = await Promise.all([
      db
        .from('job_queue')
        .select(
          'id,report_id,agency_id,client_id,status,attempts,max_attempts,last_error,scheduled_for,started_at,completed_at,created_at,updated_at,payload'
        )
        .eq('payload->>correlationId', correlationId)
        .order('created_at', { ascending: true })
        .limit(limit),
      db
        .from('audit_logs')
        .select('id,report_id,agency_id,event_type,actor_id,payload,ip_address,user_agent,created_at')
        .eq('payload->>correlationId', correlationId)
        .order('created_at', { ascending: true })
        .limit(limit),
    ]);

    if (jobsError || auditsError) {
      logger.error(
        {
          jobsError,
          auditsError,
          correlationId,
          requesterUserId: auth.userId,
        },
        'Admin trace lookup failed'
      );
      return apiError('INTERNAL_ERROR', 'Trace lookup failed', 500);
    }

    const jobRows = (jobs ?? []) as JobTraceRow[];
    const auditRows = (audits ?? []) as AuditTraceRow[];
    const reportIds = Array.from(
      new Set([
        ...jobRows.map((row) => row.report_id).filter((id): id is string => typeof id === 'string' && id.length > 0),
        ...auditRows.map((row) => row.report_id).filter((id): id is string => typeof id === 'string' && id.length > 0),
      ])
    );

    logger.info(
      {
        correlationId,
        requesterUserId: auth.userId,
        jobs: jobRows.length,
        audits: auditRows.length,
      },
      'Admin trace lookup completed'
    );

    return apiOk({
      correlationId,
      counts: {
        jobs: jobRows.length,
        audits: auditRows.length,
        timeline: jobRows.length + auditRows.length,
      },
      reportIds,
      jobs: jobRows,
      audits: auditRows,
      timeline: buildTimeline(jobRows, auditRows),
    });
  } catch (error: any) {
    logger.error({ err: error, correlationId, requesterUserId: auth.userId }, 'Admin trace lookup crashed');
    return apiError('INTERNAL_ERROR', 'Trace lookup failed', 500);
  }
}
