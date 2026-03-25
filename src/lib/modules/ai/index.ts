import { ValidatedMetricSet } from '@/types/metrics';
import { buildNarrativePrompt } from './promptBuilder';
import { generateNarrativeClaude } from './claude';
import { generateNarrativeGemini } from './gemini';
import { generateFallbackNarrative } from './fallback';
import { validateAiOutput } from './validator';
import { logger } from '@/lib/utils/logger';

export type NarrativeSource = 'claude' | 'gemini' | 'rule_based' | 'none';

export interface NarrativeResult {
  content: string;
  source: NarrativeSource;
  confidenceScore: number; // 0-100
  rawAiOutput?: string;
  validationFlaggedPhrases?: string[];
}

import { isFlagEnabled } from '@/lib/db/repositories/featureFlagRepo';

/**
 * Orchestrates the AI Fallback Chain:
 * Feature Flag Check -> Claude Haiku -> Gemini Flash -> Rule-based Engine
 */
export async function generateNarrative(
  metrics: ValidatedMetricSet
): Promise<NarrativeResult> {
  // 0. Feature Flag Kill-switch Check
  const aiActive = await isFlagEnabled('ai_narrative_enabled');
  
  if (!aiActive) {
    logger.info('AI Narrative generation disabled via feature flag. Using rule-based fallback.');
    const fallbackOutput = await generateFallbackNarrative(metrics);
    return { 
      content: fallbackOutput, 
      source: 'rule_based',
      confidenceScore: 100 // Deterministic
    };
  }

  const prompt = await buildNarrativePrompt(metrics);

  // 1. Try Gemini first (as primary or workaround when Claude credits are out)
  try {
    console.error('[AI] Attempting Gemini narrative generation...');
    const geminiOutput = await generateNarrativeGemini(prompt);
    const { isValid: geminiValid, flaggedPhrases } = validateAiOutput(geminiOutput);

    if (geminiValid) {
      return { 
        content: geminiOutput, 
        source: 'gemini', 
        confidenceScore: 85, // AI score baseline
        rawAiOutput: geminiOutput 
      };
    }
    logger.warn({ flaggedPhrases }, 'Gemini output failed validation, trying Claude');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Gemini AI failed, trying Claude fallback');
  }

  // 2. Try Claude Haiku (as fallback or secondary)
  try {
    console.error('[AI] Attempting Claude narrative generation...');
    const claudeOutput = await generateNarrativeClaude(prompt);
    const { isValid, flaggedPhrases } = validateAiOutput(claudeOutput);

    if (isValid) {
      return { 
        content: claudeOutput, 
        source: 'claude', 
        confidenceScore: 90, // Claude score baseline
        rawAiOutput: claudeOutput 
      };
    }
    logger.warn({ flaggedPhrases }, 'Claude output failed validation');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Claude AI failed');
  }

  // 3. Final Fallback: Rule-based Engine (Never throws)
  logger.info('Activating final rule-based fallback');
  const fallbackOutput = await generateFallbackNarrative(metrics);
  
  return { 
    content: fallbackOutput, 
    source: 'rule_based',
    confidenceScore: 99 // Deterministic score
  };
}
