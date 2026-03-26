import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { apiError, apiOk } from '@/lib/api-contract';

/**
 * GET /api/admin/users/[id] — Full user detail with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return apiError('FORBIDDEN', 'Super admin access required', 403);
  }

  const { id } = await params;
  const db = createSupabaseServiceClient();

  // Get user with agency
  const { data: user, error } = await db
    .from('agency_users')
    .select(`
      *,
      agency:agencies (*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !user) {
    return apiError('NOT_FOUND', 'User not found', 404);
  }

  const agencyId = (user.agency as any)?.id;

  // Fetch all related data in parallel
  const [clients, reports, connections, recentAudit] = await Promise.all([
    db.from('clients').select('id, name, is_active, created_at').eq('agency_id', agencyId).is('deleted_at', null).order('created_at', { ascending: false }),
    db.from('reports').select('id, status, period_start, period_end, created_at, client:clients(name)').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(20),
    db.from('api_connections').select('id, platform, status, account_name, last_synced_at').eq('agency_id', agencyId),
    db.from('audit_logs').select('id, event_type, payload, created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(10),
  ]);

  return apiOk({
    user,
    clients: clients.data || [],
    reports: reports.data || [],
    connections: connections.data || [],
    recentAudit: recentAudit.data || [],
  });
}

/**
 * PATCH /api/admin/users/[id] — Modify user limits, status, role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return apiError('FORBIDDEN', 'Super admin access required', 403);
  }

  const { id } = await params;
  const body = await request.json();
  const db = createSupabaseServiceClient();

  // Allowlisted fields for user modification
  const userUpdates: Record<string, any> = {};
  if (body.is_active !== undefined) userUpdates.is_active = body.is_active;
  if (body.role && ['admin', 'member', 'superadmin'].includes(body.role)) userUpdates.role = body.role;
  if (body.onboarding_completed !== undefined) userUpdates.onboarding_completed = body.onboarding_completed;

  if (Object.keys(userUpdates).length > 0) {
    userUpdates.updated_at = new Date().toISOString();
    const { error } = await db.from('agency_users').update(userUpdates).eq('id', id);
    if (error) return apiError('INTERNAL', error.message, 500);
  }

  // Agency-level modifications
  const { data: userRow } = await db.from('agency_users').select('agency_id').eq('id', id).single();
  if (userRow) {
    const agencyUpdates: Record<string, any> = {};
    if (body.plan && ['starter', 'growth', 'pro', 'enterprise'].includes(body.plan)) agencyUpdates.plan = body.plan;
    if (body.plan_report_limit !== undefined) agencyUpdates.plan_report_limit = Math.max(0, parseInt(body.plan_report_limit));
    if (body.plan_client_limit !== undefined) agencyUpdates.plan_client_limit = Math.max(1, parseInt(body.plan_client_limit));

    if (Object.keys(agencyUpdates).length > 0) {
      agencyUpdates.updated_at = new Date().toISOString();
      const { error } = await db.from('agencies').update(agencyUpdates).eq('id', userRow.agency_id);
      if (error) return apiError('INTERNAL', error.message, 500);
    }
  }

  // If user was deactivated, invalidate their Redis caches
  if (body.is_active === false) {
    try {
      const { data: userData } = await db.from('agency_users').select('email').eq('id', id).single();
      if (userData) {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
        await redis.del(`onboard:${userData.email}`);
      }
    } catch (err) {
      console.error('[Admin] Redis cleanup on deactivation failed:', err);
    }
  }

  // Log the admin action
  try {
    const superAdminDb = await import('@/lib/db/client').then(m => m.createSupabaseServerClient());
    const { data: { user: adminUser } } = await (await superAdminDb).auth.getUser();
    await db.from('audit_logs').insert({
      agency_id: userRow?.agency_id,
      event_type: 'security_event',
      actor_id: null, // superadmin might not be in agency_users
      payload: {
        action: 'admin_user_modified',
        target_user_id: id,
        changes: { ...userUpdates, ...body },
        performed_by: adminUser?.email,
      },
    });
  } catch (err) {
    console.error('[Admin] Audit log write failed:', err);
  }

  return apiOk({ success: true, message: 'User updated successfully' });
}

/**
 * DELETE /api/admin/users/[id] — Cascade delete user and all associated data
 * Requires confirmation token in request body
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch {
    return apiError('FORBIDDEN', 'Super admin access required', 403);
  }

  const { id } = await params;
  const body = await request.json();

  // REQUIRE explicit confirmation
  if (body.confirm !== 'DELETE_USER_AND_ALL_DATA') {
    return apiError('BAD_REQUEST', 'Must confirm deletion with confirm: "DELETE_USER_AND_ALL_DATA"', 400);
  }

  const db = createSupabaseServiceClient();

  // Get user and agency info first
  const { data: user, error } = await db
    .from('agency_users')
    .select('email, agency_id')
    .eq('id', id)
    .single();

  if (error || !user) {
    return apiError('NOT_FOUND', 'User not found', 404);
  }

  const agencyId = user.agency_id;

  // Cascade delete order matters — respect foreign key constraints
  // Delete from leaf tables first, then parent tables
  const deletions = [
    db.from('dead_letter_queue').delete().eq('agency_id', agencyId),
    db.from('audit_logs').delete().eq('agency_id', agencyId),
    db.from('notifications').delete().eq('agency_id', agencyId),
    db.from('report_emails').delete().in('report_id', 
      db.from('reports').select('id').eq('agency_id', agencyId) as any
    ),
    db.from('report_sections').delete().eq('agency_id', agencyId),
    db.from('job_queue').delete().eq('agency_id', agencyId),
    db.from('metric_snapshots').delete().in('client_id',
      db.from('clients').select('id').eq('agency_id', agencyId) as any
    ),
    db.from('reports').delete().eq('agency_id', agencyId),
    db.from('api_connections').delete().eq('agency_id', agencyId),
    db.from('clients').delete().eq('agency_id', agencyId),
    db.from('agency_branding').delete().eq('agency_id', agencyId),
    db.from('agency_billing').delete().eq('agency_id', agencyId),
    db.from('agency_users').delete().eq('id', id),
    db.from('agencies').delete().eq('id', agencyId),
  ];

  for (const deletion of deletions) {
    const { error: delError } = await deletion;
    if (delError) {
      console.error('[Admin] Cascade delete error:', delError);
      // Continue — best effort delete
    }
  }

  // Clean Redis caches
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    await Promise.all([
      redis.del(`onboard:${user.email}`),
      redis.del(`subdomain:*`), // Let subdomain cache expire naturally
    ]);
  } catch (err) {
    console.error('[Admin] Redis cleanup after delete failed:', err);
  }

  return apiOk({ success: true, message: `User ${user.email} and all associated data permanently deleted` });
}
