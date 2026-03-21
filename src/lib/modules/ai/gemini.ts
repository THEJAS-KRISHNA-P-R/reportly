import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { ReportlyError } from '@/types/errors';
import { REPORT } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function generateNarrativeGemini(prompt: string): Promise<string> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new ReportlyError('AI_FAILED', 'Gemini API key missing', 'Analysis engine configuration error.', 500);
  }

  return await CircuitBreaker.execute('ai', async () => {
    return await withRetry(async () => {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Manual timeout handling for Gemini SDK if not built-in or specifically required by user
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API Timeout')), REPORT.AI_TIMEOUT_MS)
          )
        ]) as any;

        const response = await result.response;
        return response.text();
      } catch (error: any) {
        throw error;
      }
    }, 'ai', 'Gemini AI Generation');
  });
}
