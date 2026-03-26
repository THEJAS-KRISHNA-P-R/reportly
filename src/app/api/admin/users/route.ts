import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { apiError } from '@/lib/api-contract';

/**
 * GET /api/admin/users — Paginated user list with agency join
 * Query params: page (1-indexed), limit, search, sort, order
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
  } catch {
    return apiError('FORBIDDEN', 'Super admin access required', 403);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') === 'asc';

  const db = createSupabaseServiceClient();
  const offset = (page - 1) * limit;

  // Build query with agency join
  let query = db
    .from('agency_users')
    .select(`
      id,
      email,
      role,
      is_active,
      onboarding_completed,
      last_login_at,
      failed_attempts,
      locked_until,
      created_at,
      agency:agencies (
        id,
        name,
        subdomain,
        plan,
        is_active,
        reports_generated_this_month,
        plan_report_limit,
        plan_client_limit,
        created_at
      )
    `, { count: 'exact' });

  // Search filter
  if (search) {
    query = query.or(`email.ilike.%${search}%,agencies.name.ilike.%${search}%`);
  }

  // Sorting
  const validSorts = ['email', 'created_at', 'last_login_at', 'role', 'is_active'];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(sortColumn, { ascending: order });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: users, error, count } = await query;

  if (error) {
    console.error('[Admin/Users] Query error:', error);
    return apiError('INTERNAL', error.message, 500);
  }

  // Enrich with computed stats
  const enrichedUsers = await Promise.all(
    (users || []).map(async (user: any) => {
      const agencyId = user.agency?.id;
      if (!agencyId) return { ...user, stats: { clients: 0, reports: 0, connections: 0 } };

      const [clientsRes, reportsRes, connectionsRes] = await Promise.all([
        db.from('clients').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).is('deleted_at', null),
        db.from('reports').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId),
        db.from('api_connections').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId),
      ]);

      return {
        ...user,
        stats: {
          clients: clientsRes.count || 0,
          reports: reportsRes.count || 0,
          connections: connectionsRes.count || 0,
        },
      };
    })
  );

  return NextResponse.json({
    users: enrichedUsers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
