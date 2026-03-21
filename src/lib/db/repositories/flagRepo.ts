import { createSupabaseServiceClient } from '@/lib/db/client';
import type { FeatureFlag } from '@/types/report';
import { logger } from '@/lib/utils/logger';

export async function getFlagByName(flagName: string): Promise<FeatureFlag | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('feature_flags')
    .select('*')
    .eq('flag_name', flagName)
    .maybeSingle();
  if (error) {
    logger.error({ err: error, flagName }, 'Failed to read feature flag');
    return null; // fail open — return null, let caller handle
  }
  return data as FeatureFlag | null;
}

export async function getAllFlags(): Promise<FeatureFlag[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('feature_flags')
    .select('*')
    .order('flag_name', { ascending: true });
  if (error) {
    logger.error({ err: error }, 'Failed to read feature flags');
    return [];
  }
  return (data ?? []) as FeatureFlag[];
}

export async function updateFlag(
  flagName: string,
  enabled: boolean,
  updatedBy?: string
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('feature_flags')
    .update({ enabled, updated_by: updatedBy ?? null })
    .eq('flag_name', flagName);
  if (error) {
    logger.error({ err: error, flagName }, 'Failed to update feature flag');
    throw error;
  }
}
