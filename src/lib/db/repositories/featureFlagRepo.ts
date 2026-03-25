import { createSupabaseServiceClient } from '@/lib/db/client';
import { handleDbError } from './_base';

export interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

/**
 * Check if a specific feature flag is active.
 */
export async function isFlagEnabled(flagName: string): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('feature_flags')
    .select('enabled')
    .eq('flag_name', flagName)
    .maybeSingle();

  if (error) {
    console.error(`[FeatureFlag] Error fetching flag ${flagName}:`, error);
    return true; // Default to TRUE for safety unless we want a fail-closed model
  }

  return data?.enabled ?? true;
}

/**
 * Update a feature flag's status.
 */
export async function updateFeatureFlag(
  flagName: string, 
  enabled: boolean, 
  adminId: string
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('feature_flags')
    .update({ 
      enabled, 
      updated_by: adminId,
      updated_at: new Date().toISOString() 
    })
    .eq('flag_name', flagName);

  if (error) handleDbError(error, 'updateFeatureFlag');
}

/**
 * List all feature flags for Admin UI.
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('feature_flags')
    .select('*')
    .order('flag_name', { ascending: true });

  if (error) handleDbError(error, 'getAllFeatureFlags');
  return (data ?? []) as FeatureFlag[];
}
