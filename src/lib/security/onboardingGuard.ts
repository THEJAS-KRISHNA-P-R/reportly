import { createSupabaseServiceClient } from '@/lib/db/client';

export async function isOnboardingComplete(agencyId: string): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from('agencies')
    .select('name')
    .eq('id', agencyId)
    .maybeSingle();
  
  if (!data) return false;
  
  // Profile is complete if name is set and not the default placeholder
  return (
    data.name !== null &&
    data.name !== 'My Agency' &&
    data.name.trim().length >= 2
  );
}
