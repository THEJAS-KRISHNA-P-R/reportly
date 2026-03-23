import { google } from 'googleapis';
import { getOAuth2Client } from './oauth';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import { REPORT } from '@/lib/constants';

const analyticsData = google.analyticsdata('v1beta');
const analyticsAdmin = google.analyticsadmin('v1beta');

/** Fetches core metrics for a specific GA4 property. */
export async function fetchGA4Data(
  propertyId: string,
  accessToken: string,
  dateRanges: Array<{ startDate: string; endDate: string }>
): Promise<any> {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  return await CircuitBreaker.execute('ga4', async () => {
    return await withRetry(async () => {
      const cleanPropertyId = propertyId.replace('properties/', '');
      const response = await analyticsData.properties.runReport({
        property: `properties/${cleanPropertyId}`,
        auth,
        requestBody: {
          dateRanges,
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' }
          ],
          dimensions: [
            { name: 'dateRange' },
            { name: 'sessionSource' }
          ]
        }
      });

      return response.data;
    }, 'api', 'GA4 Data Fetch');
  });
}

/** Lists all properties accessible to the authenticated user. */
export async function listGA4Properties(accessToken: string): Promise<any[]> {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  return await CircuitBreaker.execute('ga4', async () => {
    return await withRetry(async () => {
      // 1. List accessible accounts
      const accountsRes = await analyticsAdmin.accounts.list({ auth });
      const accounts = accountsRes.data.accounts || [];
      
      if (accounts.length === 0) return [];

      // 2. Fetch properties for all accounts in parallel
      const propertyPromises = accounts.map(account => 
        analyticsAdmin.properties.list({
          filter: `parent:${account.name}`, // account.name is already "accounts/123"
          auth,
        })
      );

      const results = await Promise.all(propertyPromises);
      
      // Combine all properties
      const allProperties = results
        .flatMap(res => res.data.properties || []);

      return allProperties;
    }, 'api', 'GA4 Discovery Suite');
  });
}
