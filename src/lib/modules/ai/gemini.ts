import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { ReportlyError } from '@/types/errors';
import { REPORT } from '@/lib/constants';

export async function generateNarrativeGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new ReportlyError('AI_FAILED', 'Gemini API key missing', 'Analysis engine configuration error.', 500);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  return await CircuitBreaker.execute('ai', async () => {
    return await withRetry(async () => {
      try {
        console.error(`[AI] Calling Gemini with model: gemini-1.5-flash`);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API Timeout')), REPORT.AI_TIMEOUT_MS)
          )
        ]) as any;

        const response = await result.response;
        console.error('[AI] Gemini response received successfully');
        return response.text();
      } catch (error: any) {
        console.error(`[AI] Gemini failed: ${error.message} (Status: ${error.status})`);
        throw error;
      }
    }, 'ai', 'Gemini AI Generation');
  });
}
