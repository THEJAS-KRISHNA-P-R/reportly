import { generateReportNarrative } from '@/lib/modules/ai';
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

  it('completes via Claude if successful and valid', async () => {
    (generateNarrativeClaude as jest.Mock).mockResolvedValue('Claude analysis text');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateReportNarrative(validated);
    
    expect(result.source).toBe('claude');
    expect(result.content).toBe('Claude analysis text');
    expect(generateNarrativeClaude).toHaveBeenCalled();
    expect(generateNarrativeGemini).not.toHaveBeenCalled();
  });

  it('falls back to Gemini if Claude fails', async () => {
    (generateNarrativeClaude as jest.Mock).mockRejectedValue(new Error('Claude down'));
    (generateNarrativeGemini as jest.Mock).mockResolvedValue('Gemini analysis text');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateReportNarrative(validated);
    
    expect(result.source).toBe('gemini');
    expect(result.content).toBe('Gemini analysis text');
    expect(generateNarrativeGemini).toHaveBeenCalled();
  });

  it('falls back to Gemini if Claude output is invalid', async () => {
    (generateNarrativeClaude as jest.Mock).mockResolvedValue('It is probably because of data.'); // "probably" is flagged
    (generateNarrativeGemini as jest.Mock).mockResolvedValue('Gemini clean output');
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateReportNarrative(validated);
    
    expect(result.source).toBe('gemini');
    expect(result.content).toBe('Gemini clean output');
  });

  it('falls back to Rule-based if all AI fails', async () => {
    (generateNarrativeClaude as jest.Mock).mockRejectedValue(new Error('Claude down'));
    (generateNarrativeGemini as jest.Mock).mockRejectedValue(new Error('Gemini down'));
    const validated = validateMetrics(mockGA4Response, null);
    const result = await generateReportNarrative(validated);
    
    expect(result.source).toBe('rule_based');
    expect(result.content).toContain('Overall performance');
  });
});
