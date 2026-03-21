import puppeteer from 'puppeteer';
import { logger } from '@/lib/utils/logger';

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    return Buffer.from(pdf);
  } catch (err: any) {
    logger.error({ err: err.message }, 'PDF Generation via Puppeteer Failed');
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}
