import { Anthropic } from '@anthropic-ai/sdk';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { ReportlyError } from '@/types/errors';
import { REPORT } from '@/lib/constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateNarrativeClaude(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ReportlyError('AI_FAILED', 'Anthropic API key missing', 'Analysis engine configuration error.', 500);
  }

  return await CircuitBreaker.execute('ai', async () => {
    return await withRetry(async () => {
      try {
        console.error('[AI] Calling Claude with model: claude-3-haiku-20240307');
        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', 
          max_tokens: 1000,
          system: "You are a professional marketing data analyst. Analyze the data objectively.",
          messages: [{ role: 'user', content: prompt }],
        }, {
          timeout: REPORT.AI_TIMEOUT_MS,
        });

        const content = response.content[0];
        if (content.type !== 'text') {
           throw new Error('Unexpected non-text response from Claude');
        }

        console.error('[AI] Claude response received successfully');
        return content.text;
      } catch (error: any) {
        if (error.status === 401 || error.status === 403) {
          throw new ReportlyError('AI_FAILED', `Claude Auth Failed: ${error.message}`, 'Analysis engine authentication error.', 500);
        }
        throw error;
      }
    }, 'ai', 'Claude AI Generation');
  });
}
