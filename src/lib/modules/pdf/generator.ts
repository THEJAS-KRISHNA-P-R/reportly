import puppeteer, { Browser } from 'puppeteer';
import { logger } from '@/lib/utils/logger';

// ── Persistent Singleton (survives Next.js hot-reloads) ──────────────
const globalForPuppeteer = global as unknown as {
  puppeteerBrowser: Browser | null;
  puppeteerJobCount: number;
};

// Initialize counters
if (!globalForPuppeteer.puppeteerJobCount) {
  globalForPuppeteer.puppeteerJobCount = 0;
}

const BROWSER_RESTART_INTERVAL = 50; // Restart browser every N jobs to prevent memory creep
const PDF_TIMEOUT_MS = 30_000; // 30s hard timeout per PDF generation

/**
 * Get or create the singleton browser instance.
 * Restarts automatically every BROWSER_RESTART_INTERVAL jobs to prevent memory creep.
 */
async function getBrowser(): Promise<Browser> {
  // Memory creep prevention: restart browser periodically
  if (
    globalForPuppeteer.puppeteerBrowser &&
    globalForPuppeteer.puppeteerJobCount >= BROWSER_RESTART_INTERVAL
  ) {
    logger.info(
      { jobCount: globalForPuppeteer.puppeteerJobCount },
      'Browser restart threshold reached. Cycling browser to prevent memory creep.'
    );
    try {
      await globalForPuppeteer.puppeteerBrowser.close();
    } catch {
      // Browser may already be dead
    }
    globalForPuppeteer.puppeteerBrowser = null;
    globalForPuppeteer.puppeteerJobCount = 0;
  }

  if (!globalForPuppeteer.puppeteerBrowser) {
    logger.info('Launching persistent browser singleton');
    globalForPuppeteer.puppeteerBrowser = await puppeteer.launch({
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Critical for containers/low-memory
        '--disable-gpu',
        '--disable-extensions',
        '--hide-scrollbars',
        '--js-flags=--max-old-space-size=256', // Cap V8 heap per renderer
      ],
    });

    // Handle browser crash/exit → auto-respawn on next request
    globalForPuppeteer.puppeteerBrowser.on('disconnected', () => {
      logger.warn('Browser singleton disconnected. Will respawn on next request.');
      globalForPuppeteer.puppeteerBrowser = null;
      globalForPuppeteer.puppeteerJobCount = 0;
    });
  }

  return globalForPuppeteer.puppeteerBrowser;
}

/**
 * Generate PDF from HTML with hard timeout and safe resource cleanup.
 *
 * Key performance decisions:
 *  - `domcontentloaded` instead of `networkidle0` — avoids 60s CPU spin on external font CDN
 *  - `Promise.race` timeout — prevents stuck jobs from hanging the worker
 *  - Browser restart every 50 jobs — prevents long-term Chromium memory creep
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS);

  try {
    const pdfPromise = _generatePdfInternal(html, controller.signal);
    const result = await pdfPromise;
    return result;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`PDF generation timed out after ${PDF_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function _generatePdfInternal(html: string, signal: AbortSignal): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // If already aborted, close immediately
  if (signal.aborted) {
    await page.close();
    throw new Error('AbortError');
  }

  const abortHandler = async () => {
    logger.warn('Abort signal received. Closing Puppeteer page to prevent leak.');
    try {
      await page.close();
    } catch {
      // Ignore
    }
  };
  signal.addEventListener('abort', abortHandler, { once: true });

  try {
    // Deterministic viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI

    // Use a secondary internal timeout for the specific content loading
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });

    if (signal.aborted) throw new Error('AbortError');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    // Increment counter for browser restart tracking
    globalForPuppeteer.puppeteerJobCount++;

    return Buffer.from(pdf);
  } finally {
    signal.removeEventListener('abort', abortHandler);
    if (!page.isClosed()) {
      await page.close();
    }
  }
}

/**
 * Gracefully close the browser singleton.
 * Called during worker shutdown to prevent orphaned Chrome processes.
 */
export async function closeBrowser(): Promise<void> {
  if (globalForPuppeteer.puppeteerBrowser) {
    logger.info('Closing browser singleton for graceful shutdown');
    try {
      await globalForPuppeteer.puppeteerBrowser.close();
    } catch {
      // Already dead
    }
    globalForPuppeteer.puppeteerBrowser = null;
    globalForPuppeteer.puppeteerJobCount = 0;
  }
}
