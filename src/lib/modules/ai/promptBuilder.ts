import fs from 'fs/promises';
import path from 'path';
import { ValidatedMetricSet } from '@/types/metrics';
import { formatPeriod } from '@/lib/utils/period';
import { REPORT } from '@/lib/constants';

export async function buildNarrativePrompt(metrics: ValidatedMetricSet): Promise<string> {
  const promptPath = path.join(process.cwd(), `src/prompts/narrative-${REPORT.PROMPT_VERSION}.txt`);
  let template = await fs.readFile(promptPath, 'utf8');

  const periodStr = formatPeriod(metrics.periodStart, metrics.periodEnd);
  
  // Only send the numeric 'value' and 'delta' to the AI
  const cleanMetrics: Record<string, any> = {};
  for (const [k, v] of Object.entries(metrics.validated)) {
    cleanMetrics[k] = { 
      current: v.value, 
      previous: v.prior, 
      percentChange: v.delta !== null ? `${v.delta.toFixed(2)}%` : null 
    };
  }

  template = template.replace('{PERIOD_FORMATTED}', periodStr);
  template = template.replace('{METRICS_JSON}', JSON.stringify(cleanMetrics, null, 2));

  return template;
}
