import { PipelineContext } from '../pipeline';
import { createReport } from '@/lib/db/repositories/reportRepo';

export async function createReportStep(context: PipelineContext): Promise<void> {
  const report = await createReport(
    context.clientId,
    context.agencyId,
    context.period.start,
    context.period.end
  );
  context.reportId = report.id;
}
