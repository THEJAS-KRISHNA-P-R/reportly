import { google } from 'googleapis';
import { getOAuth2Client } from './oauth';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { REPORT } from '@/lib/constants';

const analyticsData = google.analyticsdata('v1beta');

export async function fetchGA4Data(
  propertyId: string,
  accessToken: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  return await CircuitBreaker.execute('ga4', async () => {
    return await withRetry(async () => {
      const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        auth,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' }
          ],
          dimensions: [
            { name: 'sessionSource' }
          ]
        }
      });

      return response.data;
    }, 'api', 'GA4 Data Fetch');
  });
}
