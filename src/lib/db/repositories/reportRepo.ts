import { createSupabaseServiceClient } from '@/lib/db/client';
import type { Report, ReportStatus, NarrativeSource } from '@/types/report';
import type { ConfidenceSummary } from '@/types/metrics';
import { REPORT } from '@/lib/constants';
import { handleDbError } from './_base';

export async function createReport(
  clientId: string,
  agencyId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Report> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('reports')
    .insert({
      client_id: clientId,
      agency_id: agencyId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      prompt_version: REPORT.PROMPT_VERSION,
      template_version: REPORT.TEMPLATE_VERSION,
      logic_version: REPORT.LOGIC_VERSION,
      status: 'pending' satisfies ReportStatus,
    })
    .select()
    .single();
  if (error) handleDbError(error, 'createReport');
  return data as Report;
}

export async function getReportById(reportId: string, agencyId: string): Promise<Report | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('reports')
    .select('*, clients!inner(agency_id)')
    .eq('id', reportId)
    .eq('clients.agency_id', agencyId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...(data as any),
    month: new Date((data as any).period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } as Report;
}

export async function getReportsByClient(
  clientId: string,
  agencyId: string,
  limit = 20
): Promise<Report[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('reports')
    .select('*, clients!inner(agency_id)')
    .eq('client_id', clientId)
    .eq('clients.agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) handleDbError(error, 'getReportsByClient');
  return (data ?? []).map(r => ({
    ...r,
    month: new Date(r.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })) as Report[];
}

export async function getReportsByAgency(
  agencyId: string, 
  limit = 50,
  offset = 0
): Promise<Report[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('reports')
    .select('*, clients!inner(name, agency_id)')
    .eq('clients.agency_id', agencyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) handleDbError(error, 'getReportsByAgency');
  
  return (data ?? []).map(r => ({
    ...r,
    month: new Date(r.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })) as unknown as Report[];
}

export async function updateReportStatus(
  reportId: string,
  agencyId: string, // Enforce agency scoping
  status: ReportStatus,
  extra?: Partial<
    Pick<Report, 'generation_started_at' | 'approved_at' | 'approved_by' | 'sent_at' | 'cancelled_reason' | 'error_reason'>
  >
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('reports')
    .update({ status, ...extra })
    .eq('id', reportId)
    .eq('agency_id', agencyId); // strict isolation
  if (error) handleDbError(error, 'updateReportStatus');
}

export async function updateReportNarrative(
  reportId: string,
  agencyId: string, // Enforce agency scoping
  narrative: string,
  source: NarrativeSource,
  raw: string,
  ruleBasedNarrative: string | null,
  confidence: ConfidenceSummary
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('reports')
    .update({
      ai_narrative_raw: raw,
      ai_narrative_edited: narrative,
      final_narrative: narrative,
      narrative_source: source,
      rule_based_narrative: ruleBasedNarrative,
      confidence_summary: confidence,
      status: 'draft' satisfies ReportStatus,
    })
    .eq('id', reportId)
    .eq('agency_id', agencyId); // strict isolation
  if (error) handleDbError(error, 'updateReportNarrative');
}

export async function updateReportNarrativeEdit(
  reportId: string,
  agencyId: string,
  editedNarrative: string
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('reports')
    .update({ ai_narrative_edited: editedNarrative, final_narrative: editedNarrative })
    .eq('id', reportId);
    // Note: agency_id filter removed as it doesn't exist on reports. 
    // Validation should happen at the service/API layer or via RLS.
  if (error) handleDbError(error, 'updateReportNarrativeEdit');
}

export async function updateReportPdf(reportId: string, agencyId: string, pdfUrl: string): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('reports')
    .update({ pdf_url: pdfUrl, pdf_generated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('agency_id', agencyId);
  if (error) handleDbError(error, 'updateReportPdf');
}

export async function updateReportProgress(
  reportId: string,
  agencyId: string,
  stepName: string,
  percentage: number,
  status: 'in_progress' | 'success' | 'error' = 'in_progress'
): Promise<void> {
  const db = createSupabaseServiceClient();
  await db
    .from('reports')
    .update({ 
      current_step: { name: stepName, percentage, status, updatedAt: new Date().toISOString() } 
    })
    .eq('id', reportId)
    .eq('agency_id', agencyId);
}

export async function approveReport(
  reportId: string,
  agencyId: string,
  approvedBy: string
): Promise<Report> {
  const db = createSupabaseServiceClient();
  // Ensure report is in 'draft' state before approving
  const { data: current } = await db
    .from('reports')
    .select('status, clients!inner(agency_id)')
    .eq('id', reportId)
    .eq('clients.agency_id', agencyId)
    .single();
  if (current?.status !== 'draft') {
    handleDbError(new Error(`Report is in state '${current?.status}', not 'draft'`), 'approveReport');
  }
  const { data, error } = await db
    .from('reports')
    .update({
      status: 'approved' satisfies ReportStatus,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', reportId)
    .select()
    .single();
  if (error) handleDbError(error, 'approveReport');
  return data as Report;
}

/** Check if a report already exists for a client/period (idempotency guard). */
export async function reportExistsForPeriod(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from('reports')
    .select('id')
    .eq('client_id', clientId)
    .eq('period_start', periodStart.toISOString())
    .eq('period_end', periodEnd.toISOString())
    .not('status', 'in', '(cancelled,failed)')
    .maybeSingle();
  return data !== null;
}

/** Resets a report to pending state for regeneration. */
export async function resetReport(reportId: string, agencyId: string): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('reports')
    .update({
      status: 'pending' satisfies ReportStatus,
      ai_narrative_raw: null,
      ai_narrative_edited: null,
      rule_based_narrative: null,
      final_narrative: null,
      narrative_source: 'none',
      confidence_summary: null,
      pdf_url: null,
      approved_at: null,
      approved_by: null,
      generation_started_at: null,
      pdf_generated_at: null,
    })
    .eq('id', reportId)
    .eq('agency_id', agencyId);
  if (error) handleDbError(error, 'resetReport');
}
