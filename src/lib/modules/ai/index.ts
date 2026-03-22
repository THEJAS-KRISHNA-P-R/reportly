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
 * Claude Haiku (validated) -> Gemini Flash (validated) -> Rule-based Engine
 */
export async function generateNarrative(
  metrics: ValidatedMetricSet
): Promise<NarrativeResult> {
  const prompt = await buildNarrativePrompt(metrics);

  try {
    // 1. Try Claude Haiku
    const claudeOutput = await generateNarrativeClaude(prompt);
    const { isValid, flaggedPhrases } = validateAiOutput(claudeOutput);

    if (isValid) {
      return { content: claudeOutput, source: 'claude', rawAiOutput: claudeOutput };
    }

    // Claude output failed validation — try Gemini
    logger.warn({ flaggedPhrases }, 'Claude output failed validation, trying Gemini fallback');
    const geminiOutput = await generateNarrativeGemini(prompt);
    const { isValid: geminiValid } = validateAiOutput(geminiOutput);

    if (geminiValid) {
      return { content: geminiOutput, source: 'gemini', rawAiOutput: geminiOutput };
    }
  } catch (error: any) {
    // Claude failed — try Gemini
    logger.error({ error: error.message }, 'Claude AI failed, trying Gemini fallback');
    try {
      const geminiOutput = await generateNarrativeGemini(prompt);
      const { isValid: geminiValid } = validateAiOutput(geminiOutput);

      if (geminiValid) {
        return { content: geminiOutput, source: 'gemini', rawAiOutput: geminiOutput };
      }
    } catch (geminiError: any) {
      logger.error({ error: geminiError.message }, 'Gemini fallback failed as well');
    }
  }

  // Final Fallback: Rule-based Engine (Never throws)
  logger.info('Activating final rule-based fallback');
  const fallbackOutput = await generateFallbackNarrative(metrics);
  
  return { 
    content: fallbackOutput, 
    source: 'rule_based' 
  };
}
