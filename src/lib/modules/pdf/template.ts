import { ValidatedMetricSet } from '@/types/metrics';
import { Agency, Report } from '@/types/report';

export function getReportHtml(
  report: Report,
  agency: Agency,
  metrics: ValidatedMetricSet,
  narrative: string
): string {
  const primaryColor = agency.primary_color || agency.brand_color || '#000000';
  const secondaryColor = agency.secondary_color || '#FFFFFF';
  const accentColor = agency.accent_color || '#F3F4F6';
  const logoUrl = agency.logo_url;
  const logoPosition = agency.logo_position || 'top-left';
  const reportFont = agency.report_font || 'Inter';
  const activeSections = agency.pdf_sections || ['cover', 'summary', 'google_ads', 'meta_ads', 'ga4', 'conclusion'];
  
  const fontImport = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Roboto+Mono:wght@400;700&display=swap');
    
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400 900;
      font-display: swap;
      src: local('Inter'), local('Inter-Regular'), local('Arial');
    }
  `;

  const metricRows = Object.entries(metrics.validated).map(([key, mv]) => `
    <div class="metric-card">
      <div class="metric-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
      <div class="metric-value">${mv.value?.toLocaleString() || 'N/A'}</div>
      <div class="metric-delta ${mv.delta && mv.delta > 0 ? 'up' : 'down'}">
        ${mv.delta !== null ? (mv.delta > 0 ? '▲' : '▼') + ' ' + Math.abs(mv.delta).toFixed(1) + '%' : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        ${fontImport}
        
        :root {
          --primary: ${primaryColor};
          --secondary: ${secondaryColor};
          --accent: ${accentColor};
          --font-main: '${reportFont}', 'Inter', sans-serif;
          
          /* Dynamic Scaling Tokens */
          --base-font-size: ${
            agency.report_font_size === 'small' ? '12px' : 
            agency.report_font_size === 'large' ? '16px' : '14px'
          };
          --metric-padding: ${agency.metric_density === 'high' ? '16px' : '24px'};
          --metric-gap: ${agency.metric_density === 'high' ? '12px' : '16px'};
        }

        @page {
          size: A4;
          margin: 0;
        }

        body { 
          font-family: var(--font-main);
          font-size: var(--base-font-size);
          margin: 0; 
          padding: 0;
          color: #0f172a; 
          line-height: 1.4;
          background: #ffffff;
        }


        .page {
          padding: 60px;
          position: relative;
          min-height: 1120px; /* A4 height approx */
          box-sizing: border-box;
          page-break-after: always;
        }

        ${agency.watermark_enabled && agency.watermark_text ? `
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 100px;
            font-weight: 900;
            color: rgba(15, 23, 42, 0.03);
            white-space: nowrap;
            pointer-events: none;
            z-index: 1000;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
        ` : ''}

        /* High-Density Header */
        .cover-header { 
          background: var(--primary);
          color: var(--secondary);
          padding: 80px 60px;
          margin: -60px -60px 40px -60px;
          position: relative;
        }

        .logo-frame {
          position: absolute;
          ${logoPosition === 'top-left' ? 'top: 40px; left: 60px;' : 
            logoPosition === 'top-right' ? 'top: 40px; right: 60px;' :
            logoPosition === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' :
            logoPosition === 'bottom-left' ? 'bottom: 40px; left: 60px;' :
            'bottom: 40px; right: 60px;'}
        }
        
        .logo-img { 
          max-height: 64px; 
          max-width: 240px; 
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); 
        }
        
        .report-meta { margin-top: 120px; }
        .type-label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; opacity: 0.7; margin-bottom: 8px; }
        .title { font-size: 42px; font-weight: 900; line-height: 1; letter-spacing: -0.04em; margin: 0; }
        .period-pill { display: inline-block; margin-top: 24px; padding: 6px 14px; background: rgba(0,0,0,0.1); border-radius: 99px; font-size: 12px; font-weight: 700; }

        /* Content Sections */
        .section { margin-bottom: 48px; }
        .section-header { 
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .section-bar { height: 20px; width: 4px; background: var(--primary); border-radius: 2px; }
        .section-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; color: var(--primary); }

        /* Metrics Architecture */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 16px; 
        }
        .metric-card { 
          padding: var(--metric-padding); 
          background: #f8fafc; 
          border-radius: 16px; 
          border: 1px solid #e2e8f0;

          transition: border-color 0.2s;
        }
        .metric-label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
        .metric-value { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 8px; font-family: 'Roboto Mono', monospace; }
        .metric-delta { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .metric-delta.up { color: #10b981; }
        .metric-delta.down { color: #ef4444; }

        /* Typography */
        .narrative-box { 
          font-size: 14px; 
          color: #334155; 
          line-height: 1.7; 
          background: #fdfdfd;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }
        
        .footer { 
          position: absolute;
          bottom: 60px;
          left: 60px;
          right: 60px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .powered-by { font-weight: 900; color: #cbd5e1; }
      </style>
    </head>
    <body>
      ${agency.watermark_enabled && agency.watermark_text ? `<div class="watermark">${agency.watermark_text}</div>` : ''}
      
      <div class="page">
        ${activeSections.includes('cover') ? `
          <div class="cover-header">
            <div class="logo-frame">
              ${logoUrl ? `<img src="${logoUrl}" class="logo-img" />` : `<div style="font-weight:900; font-size:24px;">${agency.name}</div>`}
            </div>
            <div class="report-meta">
              <div class="type-label">Strategic Performance Artifact</div>
              <h1 class="title">${report.clients?.name || 'Enterprise Client'}</h1>
              <div class="period-pill">${report.month} Phase Metrics</div>
            </div>
          </div>
        ` : ''}

        <div class="content">
          ${activeSections.includes('summary') ? `
            <div class="section">
              <div class="section-header">
                <div class="section-bar"></div>
                <h2 class="section-title">Executive Narrative</h2>
              </div>
              <div class="narrative-box">${narrative}</div>
            </div>
          ` : ''}

          ${(activeSections.includes('ga4') || activeSections.includes('google_ads')) ? `
            <div class="section">
              <div class="section-header">
                <div class="section-bar"></div>
                <h2 class="section-title">Core KPI Network</h2>
              </div>
              <div class="metrics-grid">
                ${metricRows}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div>Entity: ${agency.name} // Ref: ${report.id.substring(0,8).toUpperCase()}</div>
          ${agency.show_powered_by ? `<div class="powered-by">Powered by Reportly AI Architecture</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
