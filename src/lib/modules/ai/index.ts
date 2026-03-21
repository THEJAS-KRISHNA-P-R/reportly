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
  rawAiOutput?: string;
  validationFlaggedPhrases?: string[];
}

/**
 * Orchestrates the AI Fallback Chain:
 * Claude Haiku -> Gemini Flash -> Rule-based Engine
 */
export async function generateReportNarrative(
  metrics: ValidatedMetricSet
): Promise<NarrativeResult> {
  const prompt = await buildNarrativePrompt(metrics);

  // 1. Try Claude Haiku
  try {
    const claudeOutput = await generateNarrativeClaude(prompt);
    const { isValid, flaggedPhrases } = validateAiOutput(claudeOutput);

    if (isValid) {
      return { content: claudeOutput, source: 'claude', rawAiOutput: claudeOutput };
    }

    logger.warn({ flaggedPhrases }, 'Claude output failed validation, falling back to Gemini');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Claude AI failed, falling back to Gemini');
  }

  // 2. Try Gemini Flash
  try {
    const geminiOutput = await generateNarrativeGemini(prompt);
    const { isValid, flaggedPhrases } = validateAiOutput(geminiOutput);

    if (isValid) {
      return { content: geminiOutput, source: 'gemini', rawAiOutput: geminiOutput };
    }

    logger.warn({ flaggedPhrases }, 'Gemini output failed validation, falling back to Rule-based');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Gemini AI failed, falling back to Rule-based');
  }

  // 3. Final Fallback: Rule-based Engine
  logger.info('Activating final rule-based fallback');
  const fallbackOutput = await generateFallbackNarrative(metrics);
  
  return { 
    content: fallbackOutput, 
    source: 'rule_based' 
  };
}
