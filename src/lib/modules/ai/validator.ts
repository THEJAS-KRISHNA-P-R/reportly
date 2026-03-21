/**
 * Scans AI output for speculative language patterns.
 * Rule: No "likely", "possibly", "probably" unless backed by data.
 * For MVP, we reject the output if these patterns are found without 
 * adjacent metric citations (though for now, any hit triggers fallback).
 */
export function validateAiOutput(narrative: string): { isValid: boolean; flaggedPhrases: string[] } {
  const SPECULATIVE_PATTERNS = [
    /likely due to/i,
    /possibly because/i,
    /possible/i,
    /might be/i,
    /could indicate/i,
    /perhaps/i,
    /we suspect/i,
    /probably/i,
    /we believe/i,
    /assumption/i
  ];

  const flaggedPhrases: string[] = [];

  for (const pattern of SPECULATIVE_PATTERNS) {
    const match = narrative.match(pattern);
    if (match) {
      flaggedPhrases.push(match[0]);
    }
  }

  return {
    isValid: flaggedPhrases.length === 0,
    flaggedPhrases
  };
}
