import { NextResponse } from 'next/server';
import { refreshGA4Token } from '@/lib/modules/analytics/ga4/refresh';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const accessToken = await refreshGA4Token(clientId);

    return NextResponse.json({ success: true, accessToken });
  } catch (error: any) {
    logger.error({ err: error.message }, 'GA4 manual refresh failed');
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
