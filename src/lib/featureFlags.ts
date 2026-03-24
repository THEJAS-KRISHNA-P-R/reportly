import { createSupabaseServiceClient } from '@/lib/db/client';

/**
 * Feature Flag helper.
 * Checks environment overrides first, then falls back to database.
 */
export async function isEnabled(flagName: string): Promise<boolean> {
  // Check env var override first (for local dev)
  const envKey = `FF_${flagName.toUpperCase().replace(/-/g, '_')}`;
  const envVal = process.env[envKey];
  
  if (envVal !== undefined) {
    return envVal === 'true';
  }

  // Fall back to DB
  try {
    const supabase = createSupabaseServiceClient();
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', flagName)
      .maybeSingle();

    return data?.enabled ?? false;
  } catch {
    // If table doesn't exist or query fails, default to false (safe)
    return false;
  }
}
