import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role to bypass RLS in webhook
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    if (!data?.to?.[0]) {
      return apiOk({ received: true, skip: 'No recipient data' });
    }

    const recipient = data.to[0];

    if (type === 'email.delivered' || type === 'email.bounced') {
      const newStatus = type === 'email.delivered' ? 'delivered' : 'failed';
      
      // Find the client with this email
      const { data: client } = await supabase.from('clients').select('id').ilike('email', recipient).single();

      if (client) {
         // Update the most recent 'sent' report for this client
         await supabase.from('reports')
            .update({ status: newStatus })
            .eq('client_id', client.id)
            .eq('status', 'sent');
      }
    }

    return apiOk({ received: true });
  } catch (err: any) {
    return fromUnknownError(err, 'Resend webhook failed');
  }
}
