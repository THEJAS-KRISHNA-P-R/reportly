import { ReportPeriod, FetchResult } from '@/types/adapters';
import { ValidatedMetricSet } from '@/types/metrics';
import { NarrativeResult } from '@/lib/modules/ai';
import { logger } from '@/lib/utils/logger';

export interface PipelineContext {
  clientId: string;
  agencyId: string;
  period: ReportPeriod;
  correlationId?: string;
  idempotencyKey?: string;
  runKey?: string;
  jobId?: string;
  attempt?: number;
  // Intermediate data
  fetchResult?: FetchResult;
  validationResult?: ValidatedMetricSet;
  narrativeResult?: NarrativeResult;
  reportId?: string;
  mock?: boolean;
}

export type PipelineStep = (context: PipelineContext) => Promise<void>;

interface PipelineStepDefinition {
  name: string;
  step: PipelineStep;
  critical: boolean;
  timeoutMs: number;
}

export class Pipeline {
  private steps: PipelineStepDefinition[] = [];
  private static readonly inFlightByIdempotencyKey = new Map<string, Promise<void>>();

  constructor(private readonly defaultStepTimeoutMs: number = 120_000) {}

  addStep(name: string, step: PipelineStep, critical: boolean = true, timeoutMs?: number): this {
    this.steps.push({
      name,
      step,
      critical,
      timeoutMs: timeoutMs ?? this.defaultStepTimeoutMs,
    });
    return this;
  }

  private async runWithTimeout(step: PipelineStep, context: PipelineContext, timeoutMs: number): Promise<void> {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      await Promise.race([
        step(context),
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Pipeline step timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async runSteps(context: PipelineContext): Promise<void> {
    logger.info(
      {
        reportId: context.reportId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        idempotencyKey: context.idempotencyKey,
        runKey: context.runKey,
        stepCount: this.steps.length,
      },
      'Pipeline started'
    );

    try {
      for (const { name, step, critical, timeoutMs } of this.steps) {
        const startedAt = Date.now();

        try {
          await this.runWithTimeout(step, context, timeoutMs);

          logger.info(
            {
              reportId: context.reportId,
              correlationId: context.correlationId,
              step: name,
              durationMs: Date.now() - startedAt,
            },
            'Pipeline step completed'
          );
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;

          if (critical) {
            logger.error(
              {
                reportId: context.reportId,
                correlationId: context.correlationId,
                step: name,
                durationMs: Date.now() - startedAt,
                err: message,
                stack,
              },
              'Critical pipeline step failed'
            );
            throw error;
          }

          logger.warn(
            {
              reportId: context.reportId,
              correlationId: context.correlationId,
              step: name,
              durationMs: Date.now() - startedAt,
              err: message,
            },
            'Non-critical pipeline step failed; continuing'
          );
        }
      }

      logger.info(
        { reportId: context.reportId, correlationId: context.correlationId, idempotencyKey: context.idempotencyKey },
        'Pipeline completed successfully'
      );
    } catch (error) {
      logger.error(
        { reportId: context.reportId, correlationId: context.correlationId, idempotencyKey: context.idempotencyKey },
        'Pipeline failed'
      );
      throw error;
    }
  }

  async run(context: PipelineContext): Promise<void> {
    const key = context.idempotencyKey;
    if (!key) {
      await this.runSteps(context);
      return;
    }

    const existingRun = Pipeline.inFlightByIdempotencyKey.get(key);
    if (existingRun) {
      logger.warn(
        { reportId: context.reportId, jobId: context.jobId, correlationId: context.correlationId, idempotencyKey: key },
        'Pipeline dedupe hit: waiting for in-flight run with the same idempotency key'
      );
      await existingRun;
      return;
    }

    const runPromise = this.runSteps(context).finally(() => {
      Pipeline.inFlightByIdempotencyKey.delete(key);
    });

    Pipeline.inFlightByIdempotencyKey.set(key, runPromise);
    await runPromise;
  }
}
