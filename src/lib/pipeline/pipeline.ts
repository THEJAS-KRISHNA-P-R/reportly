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
    for (const { name, step, critical } of this.steps) {
      try {
        await step(context);
      } catch (error: any) {
        if (critical) {
          throw error; // Stop pipeline for critical failures
        }
        // Non-critical: log and proceed
        console.warn(`Non-critical pipeline step [${name}] failed: ${error.message}`);
      }
    }
  }
}
