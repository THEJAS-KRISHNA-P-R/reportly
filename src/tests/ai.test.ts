import { generateNarrative } from '@/lib/modules/ai';
import { generateNarrativeClaude } from '@/lib/modules/ai/claude';
import { generateNarrativeGemini } from '@/lib/modules/ai/gemini';
import { validateMetrics } from '@/lib/validators/metricValidator';
import { mockGA4Response } from './fixtures/metrics';

jest.mock('@/lib/modules/ai/claude');
jest.mock('@/lib/modules/ai/gemini');
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

describe('AI Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes via Gemini if successful and valid', async () => {
    (generateNarrativeGemini as jest.Mock).mockResolvedValue('Gemini analysis text');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateNarrative(validated);
    
    expect(result.source).toBe('gemini');
    expect(result.content).toBe('Gemini analysis text');
    expect(generateNarrativeGemini).toHaveBeenCalled();
    expect(generateNarrativeClaude).not.toHaveBeenCalled();
  });

  it('falls back to Claude if Gemini fails', async () => {
    (generateNarrativeGemini as jest.Mock).mockRejectedValue(new Error('Gemini down'));
    (generateNarrativeClaude as jest.Mock).mockResolvedValue('Claude analysis text');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateNarrative(validated);
    
    expect(result.source).toBe('claude');
    expect(result.content).toBe('Claude analysis text');
    expect(generateNarrativeClaude).toHaveBeenCalled();
  });

  it('falls back to Claude if Gemini output is invalid', async () => {
    (generateNarrativeGemini as jest.Mock).mockResolvedValue("It's possible that data was corrupted."); // Flagged by speculative validator
    (generateNarrativeClaude as jest.Mock).mockResolvedValue('Claude clean output');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateNarrative(validated);
    
    expect(result.source).toBe('claude');
    expect(result.content).toBe('Claude clean output');
  });

  it('falls back to Rule-based if all AI fails', async () => {
    (generateNarrativeClaude as jest.Mock).mockRejectedValue(new Error('Claude down'));
    (generateNarrativeGemini as jest.Mock).mockRejectedValue(new Error('Gemini down'));
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateNarrative(validated);
    
    expect(result.source).toBe('rule_based');
    expect(result.content).toContain('During this reporting period');
  });
});
