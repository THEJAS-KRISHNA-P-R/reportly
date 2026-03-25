import type { ConfidenceSummary } from './metrics';

export type ReportStatus =
  | 'pending'
  | 'generating'
  | 'draft'
  | 'approved'
  | 'sent'
  | 'failed'
  | 'cancelled';

export type NarrativeSource = 'claude' | 'gemini' | 'rule_based' | 'none';

export type AuditEventType =
  | 'api_fetch'
  | 'validation'
  | 'validation_failure'
  | 'ai_prompt'
  | 'ai_response'
  | 'ai_failure'
  | 'snapshot_created'
  | 'snapshot_failed'
  | 'fallback_activated'
  | 'output_rejected'
  | 'edit'
  | 'approval'
  | 'pdf_generated'
  | 'pdf_failed'
  | 'pipeline_completed'
  | 'email_sent'
  | 'email_failed'
  | 'job_dlq'
  | 'token_refresh'
  | 'token_revoked'
  | 'rate_limit_hit'
  | 'security_event';

export interface AgencyBranding {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  logo_position: string | null;
  report_font: string | null;
  report_layout: string | null;
  watermark_text: string | null;
  watermark_enabled: boolean;
  show_powered_by: boolean;
  pdf_sections: string[] | null;
  email_html: string | null;
  email_css: string | null;
  report_font_size: string | null;
  metric_density: string | null;
}


export interface Agency {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  logo_url: string | null;
  logo_position: string;
  brand_color: string; // Deprecated, use primary_color
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  report_font: string;
  report_layout: string;
  show_powered_by: boolean;
  watermark_text: string | null;
  watermark_enabled: boolean;
  email_html: string | null;
  email_css: string | null;
  pdf_sections: string[] | null;
  report_font_size: string;
  metric_density: string;
  plan: 'starter' | 'growth' | 'pro' | 'enterprise';

  plan_client_limit: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface AgencyUser {
  id: string;
  agency_id: string;
  email: string;
  role: 'admin' | 'member';
  is_active: boolean;
  last_login_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  contact_email: string | null;
  report_emails: string[];
  schedule_day: number;
  timezone: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  contact_email?: string;
  report_emails: string[];
  schedule_day: number;
  timezone: string;
}

export interface UpdateClientInput {
  name?: string;
  contact_email?: string;
  report_emails?: string[];
  schedule_day?: number;
  timezone?: string;
}

export interface ApiConnection {
  id: string;
  client_id: string;
  platform: string;
  access_token_enc: string;
  refresh_token_enc: string;
  account_id: string | null;
  account_name: string | null;
  scopes_granted: string[] | null;
  status: 'connected' | 'disconnected' | 'error' | 'revoked';
  last_synced_at: string | null;
  last_error: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Decrypted tokens — only available server-side after repo.getConnection()
  access_token?: string;
  refresh_token?: string;
}

export interface Report {
  id: string;
  client_id: string;
  agency_id: string;
  period_start: string;
  period_end: string;
  prompt_version: string;
  template_version: string;
  logic_version: string;
  ai_narrative_raw: string | null;
  ai_narrative_edited: string | null;
  rule_based_narrative: string | null;
  final_narrative: string | null;
  narrative_source: NarrativeSource | null;
  confidence_summary: ConfidenceSummary | null;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  status: ReportStatus;
  generation_started_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  sent_at: string | null;
  cancelled_reason: string | null;
  error_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  clients?: { name: string };
  month?: string;
  snapshot_id?: string | null;
  current_step?: {
    name: string;
    percentage: number;
    status: 'in_progress' | 'success' | 'error';
    updatedAt: string;
  } | null;
}


export interface AuditLog {
  id: string;
  report_id: string;
  agency_id: string;
  event_type: AuditEventType;
  actor_id: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ReportEmail {
  id: string;
  report_id: string;
  recipient_email: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed' | 'spam';
  provider_id: string | null;
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricSnapshot {
  id: string;
  client_id: string;
  platform: string;
  period_start: string;
  period_end: string;
  raw_api_response: Record<string, unknown>;
  validated_metrics: Record<string, unknown> | null;
  breakdown: any | null;
  validation_warnings: string[] | null;
  freshness_status: 'fresh' | 'preliminary' | 'stale';
  data_retrieved_at: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  description: string;
  updated_by: string | null;
  updated_at: string;
}
