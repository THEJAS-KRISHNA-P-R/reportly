import { Agency, Report } from '@/types/report';

export function getReportEmailHtml(
  report: Report,
  agency: Agency,
  downloadUrl: string
): string {
  const brandColor = agency.brand_color || '#3b82f6';
  const logoUrl = agency.logo_url || 'https://via.placeholder.com/150?text=Reportly';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: ${brandColor}; padding: 30px; text-align: center; }
        .logo { max-height: 50px; }
        .content { padding: 40px; color: #333333; line-height: 1.6; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .summary { background-color: #f9fafb; border-left: 4px solid ${brandColor}; padding: 20px; margin: 20px 0; font-style: italic; }
        .button-container { text-align: center; margin-top: 30px; }
        .button { background-color: ${brandColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${agency.name}" class="logo" />
        </div>
        <div class="content">
          <div class="title">Your Performance Report is Ready</div>
          <p>Hello,</p>
          <p>Your performance report for <strong>${agency.name}</strong> is now available. Here is a brief summary of the findings:</p>
          
          <div class="summary">
            ${report.final_narrative?.slice(0, 300)}...
          </div>

          <p>You can view and download the full PDF report by clicking the button below:</p>
          
          <div class="button-container">
            <a href="${downloadUrl}" class="button">View Full Report</a>
          </div>
          
          <p>If you have any questions, please feel free to reach out to us.</p>
          <p>Best regards,<br/>The ${agency.name} Team</p>
        </div>
        <div class="footer">
          Sent by Reportly. Powered by AI.
        </div>
      </div>
    </body>
    </html>
  `;
}
