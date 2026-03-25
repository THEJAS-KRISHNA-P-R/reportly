import { createSupabaseServerClient } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract provider token (Google Access Token)
    const providerToken = session.provider_token;
    
    if (!providerToken) {
      console.warn('[GA4 Properties] No provider token found in session.');
      return NextResponse.json({ 
        properties: [],
        message: 'No Google connection found. Please sign in with Google again to grant analytics access.'
      });
    }

    // 3. Fetch account summaries from Google Analytics Admin API
    // https://analyticsadmin.googleapis.com/v1beta/accountSummaries
    const googleRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Accept': 'application/json'
      }
    });

    if (!googleRes.ok) {
      const errorData = await googleRes.json().catch(() => ({}));
      console.error('[GA4 Properties] Google API Error:', errorData);
      
      // If unauthorized, the token might be expired
      if (googleRes.status === 401) {
        return NextResponse.json({ 
          properties: [], 
          message: 'Google session expired. Please sign in again.' 
        });
      }
      
      throw new Error('Failed to fetch from Google Analytics');
    }

    const data = await googleRes.json();
    
    // 4. Flatten account summaries into a simple property list
    // Each account summary has a 'propertySummaries' array
    const properties: any[] = [];
    
    (data.accountSummaries || []).forEach((account: any) => {
      (account.propertySummaries || []).forEach((prop: any) => {
        properties.push({
          id: prop.property.split('/').pop(), // properties/123 -> 123
          displayName: prop.displayName,
          parentAccount: account.displayName
        });
      });
    });

    return NextResponse.json({ 
      properties,
      message: properties.length > 0 
        ? `Successfully retrieved ${properties.length} properties` 
        : 'Authenticated with Google, but no GA4 properties were found.'
    });

  } catch (err: any) {
    console.error('[GA4 Properties GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
