import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/modules/analytics/ga4/oauth';
import { analyticsRegistry } from '@/lib/modules/analytics/registry';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateBase64 = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/clients?error=${error}`, request.url));
  }

  if (!code || !stateBase64) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());
    const { clientId } = state;

    if (!clientId) throw new Error('Invalid state: missing clientId');

    const adapter = analyticsRegistry.getAdapter('ga4');
    await adapter.connect(clientId, code, ''); // agencyId handled by RLS/Repo

    return NextResponse.redirect(new URL(`/dashboard/clients/${clientId}?success=ga4-connected`, request.url));
  } catch (err: any) {
    logger.error({ err: err.message }, 'GA4 OAuth Callback Failed');
    return NextResponse.redirect(new URL(`/dashboard/clients?error=oauth-failed`, request.url));
  }
}
