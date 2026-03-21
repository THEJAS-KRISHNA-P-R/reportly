import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from './logger';

export type ValidFeatureFlag = 
  | 'ai-narrative'
  | 'email-delivery'
  | 'meta-integration'
  | 'pdf-charts'
  | 'admin-panel';

interface CacheEntry {
  isEnabled: boolean;
  targetIds: string[] | null;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
const cache = new Map<ValidFeatureFlag, CacheEntry>();

export class FeatureFlags {
  static async isEnabled(flag: ValidFeatureFlag, agencyId?: string): Promise<boolean> {
    // 1. Check Env Vars first (Highest Priority)
    const envVal = process.env[`FLAG_${flag.toUpperCase().replace('-', '_')}`];
    if (envVal === 'true') return true;
    if (envVal === 'false') return false;

    // 2. Check 30-sec memory cache
    const now = Date.now();
    const cached = cache.get(flag);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      if (!cached.isEnabled) return false;
      if (!cached.targetIds || cached.targetIds.length === 0) return true; // Global rollout
      if (agencyId && cached.targetIds.includes(agencyId)) return true; // Targeted rollout
      return false;
    }

    // 3. Fallback to Database
    try {
      const db = createSupabaseServiceClient();
      const { data, error } = await db
        .from('feature_flags')
        .select('is_enabled, target_ids')
        .eq('key', flag)
        .maybeSingle();

      if (error || !data) {
        // If flag missing in DB, default to false and cache it
        cache.set(flag, { isEnabled: false, targetIds: null, fetchedAt: now });
        return false;
      }

      cache.set(flag, {
        isEnabled: data.is_enabled,
        targetIds: data.target_ids as string[] | null,
        fetchedAt: now,
      });

      if (!data.is_enabled) return false;
      if (!data.target_ids || !Array.isArray(data.target_ids) || data.target_ids.length === 0) return true;
      if (agencyId && data.target_ids.includes(agencyId)) return true;
      
      return false;
    } catch (err) {
      logger.error({ flag, error: err }, 'Failed to fetch feature flag, safely defaulting to false');
      return false;
    }
  }
}
