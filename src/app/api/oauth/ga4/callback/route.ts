import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { encrypt } from '@/lib/security/encryption';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code  = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_denied', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_invalid', request.url)
      );
    }

    // 1. Verify state signature
    const [stateB64, signature] = state.split(':');
    const stateData = Buffer.from(stateB64, 'base64url').toString();
    const expectedSig = crypto
      .createHmac('sha256', process.env.OAUTH_STATE_SECRET!)
      .update(stateData)
      .digest('hex');

    if (signature !== expectedSig) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_csrf', request.url)
      );
    }

    // 2. Parse and validate state
    const { clientId, agencyId, timestamp } = JSON.parse(stateData);
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_expired', request.url)
      );
    }

    // 3. Get PKCE verifier from cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('ga4_pkce')?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_pkce', request.url)
      );
    }

    // 4. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
        grant_type:    'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[GA4 Callback] Token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_token', request.url)
      );
    }

    // 5. Get GA4 property ID (using robust discovery)
    const { listGA4Properties } = await import('@/lib/modules/analytics/ga4/fetcher');
    const properties = await listGA4Properties(tokenData.access_token);
    const propertyId = properties?.[0]?.name ?? null;
    // propertyId format: "properties/123456789"

    // 6. Encrypt tokens
    const accessTokenEnc  = encrypt(tokenData.access_token);
    const refreshTokenEnc = encrypt(tokenData.refresh_token ?? '');

    // 7. Store in database
    const db = createSupabaseServiceClient();
    const { error: dbError } = await db
      .from('api_connections')
      .upsert({
        client_id:         clientId,
        agency_id:         agencyId,
        platform:          'ga4',
        access_token_enc:  accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        account_id:        propertyId,
        status:            'connected',
        last_synced_at:    new Date().toISOString(),
        token_expires_at:  new Date(
          Date.now() + (tokenData.expires_in ?? 3600) * 1000
        ).toISOString(),
      }, {
        onConflict: 'client_id,platform',
      });

    if (dbError) {
      console.error('[GA4 Callback] DB error:', dbError);
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=oauth_db', request.url)
      );
    }

    // 8. Clear PKCE cookie
    cookieStore.delete('ga4_pkce');

    // 9. Redirect to client page (CORRECTED PATH)
    return NextResponse.redirect(
      new URL(
        `/clients/${clientId}?connected=true`,
        request.url
      )
    );

  } catch (error) {
    console.error('[GA4 Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/clients?error=oauth_unknown', request.url)
    );
  }
}
