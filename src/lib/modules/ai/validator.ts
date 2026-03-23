/**
 * Scans AI output for speculative language patterns.
 * Only flags clearly unsupported speculation — not normal analytical language.
 */
export function validateAiOutput(narrative: string): { isValid: boolean; flaggedPhrases: string[] } {
  const SPECULATIVE_PATTERNS = [
    /we suspect/i,
    /we believe without data/i,
    /disclaimer: i (am|cannot|don't)/i,
    /as an ai/i,
    /i don't have access to/i,
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
