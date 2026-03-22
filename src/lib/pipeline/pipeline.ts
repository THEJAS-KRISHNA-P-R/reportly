import { ReportPeriod, FetchResult } from '@/types/adapters';
import { ValidatedMetricSet } from '@/types/metrics';
import { NarrativeResult } from '@/lib/modules/ai';

export interface PipelineContext {
  clientId: string;
  agencyId: string;
  period: ReportPeriod;
  // Intermediate data
  fetchResult?: FetchResult;
  validationResult?: ValidatedMetricSet;
  narrativeResult?: NarrativeResult;
  reportId?: string;
}

export type PipelineStep = (context: PipelineContext) => Promise<void>;

export class Pipeline {
  private steps: { name: string; step: PipelineStep; critical: boolean }[] = [];

  addStep(name: string, step: PipelineStep, critical: boolean = true): this {
    this.steps.push({ name, step, critical });
    return this;
  }

  async run(context: PipelineContext): Promise<void> {
    console.error(`[Pipeline] Starting report ${context.reportId}`);
    let finalStatus = 'success';
    try {
      for (const { name, step, critical } of this.steps) {
        console.error(`[Pipeline] Running step: ${name}`);
        try {
          await step(context);
          console.error(`[Pipeline] Step completed: ${name}`);
        } catch (error: any) {
          console.error(`[Pipeline] Step FAILED: ${name}`, error);
          if (critical) {
            finalStatus = 'failed';
            throw error; // Stop pipeline for critical failures
          }
          // Non-critical: log and proceed
          console.warn(`Non-critical pipeline step [${name}] failed: ${error.message}`);
        }
      }
    } catch (err: any) {
      finalStatus = 'failed';
      throw err;
    } finally {
      console.error(`[Pipeline] Complete. Status: ${finalStatus}`);
    }
  }
}
