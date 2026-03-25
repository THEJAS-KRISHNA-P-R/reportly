import { PipelineContext } from '../pipeline';
import { getReportHtml } from '@/lib/modules/pdf/template';
import { generatePdfFromHtml } from '@/lib/modules/pdf/generator';
import { updateReportPdf, getReportById, updateReportProgress } from '@/lib/db/repositories/reportRepo';
import { getAgencyById } from '@/lib/db/repositories/agencyRepo';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export async function generatePDFStep(context: PipelineContext): Promise<void> {
  if (context.reportId) {
    await updateReportProgress(context.reportId, context.agencyId, 'Assembling Enterprise PDF...', 90);
  }
  if (!context.reportId || !context.validationResult || !context.narrativeResult) {
    throw new Error('Required context missing for generatePDFStep');
  }

  try {
    const report = await getReportById(context.reportId, context.agencyId);
    if (!report) throw new Error('Report not found for PDF generation');

    const agency = await getAgencyById(context.agencyId);
    if (!agency) throw new Error('Agency not found for PDF generation');

    const html = getReportHtml(
      report,
      agency,
      context.validationResult,
      context.narrativeResult.content
    );

    let pdfBuffer: Buffer;

    // Use Railway Worker if URL is present (Section 9 of context)
    if (process.env.RAILWAY_WORKER_URL) {
      logger.info({ reportId: context.reportId }, 'Using Railway worker for PDF generation');
      const response = await fetch(process.env.RAILWAY_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-secret': process.env.RAILWAY_WORKER_SECRET || '',
        },
        body: JSON.stringify({ html, reportId: context.reportId }),
      });

      if (!response.ok) {
        throw new Error(`Railway Worker Failed: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      // Local fallback via Puppeteer
      logger.info({ reportId: context.reportId }, 'Using local Puppeteer fallback for PDF generation');
      pdfBuffer = await generatePdfFromHtml(html);
    }
    
    // Real upload to Supabase Storage (report_pdfs bucket)
    const supabase = createSupabaseServiceClient();
    const filePath = `${context.agencyId}/${context.clientId}/${context.reportId}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('report_pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Supabase Storage Upload Failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('report_pdfs')
      .getPublicUrl(filePath);

    await updateReportPdf(context.reportId, context.agencyId, publicUrl);
    
    logger.info({ reportId: context.reportId }, 'PDF Generated and Uploaded Successfully');
  } catch (error: any) {
    logger.error({ err: error.message, reportId: context.reportId }, 'PDF Generation Step Failed');
    throw error;
  }
}
