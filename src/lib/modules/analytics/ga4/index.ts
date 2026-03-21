import { DataSourceAdapter, ReportPeriod, FetchResult } from '@/types/adapters';
import { Platform } from '@/types/metrics';
import * as oauth from './oauth';
import { fetchGA4Data } from './fetcher';
import { transformGA4Response } from './transformer';
import * as connectionRepo from '@/lib/db/repositories/connectionRepo';
import { ReportlyError } from '@/types/errors';

export class GA4DataSourceAdapter implements DataSourceAdapter {
  platform: Platform = 'ga4';

  async connect(clientId: string, authCode: string, _agencyId: string): Promise<void> {
    const tokens = await oauth.exchangeCodeForTokens(authCode);
    
    // For GA4, we usually need the propertyId. In a real flow, 
    // we'd probably call another API to list properties and let the user pick.
    // For the MVP, we assume the propertyId might be passed or we fetch the first available.
    // Here we'll just store the tokens. The propertyId (account_id) will be updated later 
    // or fetched from the tokens if they contain it (usually not).
    
    await connectionRepo.upsertConnection(
      clientId,
      this.platform,
      {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      {
        accountId: 'pending', // Will be set via sync/selection
        accountName: 'GA4 Property',
        scopes: tokens.scope?.split(' ') || [],
      }
    );
  }

  async refresh(clientId: string): Promise<boolean> {
    const conn = await connectionRepo.getConnection(clientId, this.platform);
    if (!conn || !conn.refresh_token) return false;

    try {
      const tokens = await oauth.refreshAccessToken(conn.refresh_token);
      await connectionRepo.upsertConnection(
        clientId,
        this.platform,
        {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token!, // Reuse or update
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
        {
          accountId: conn.account_id || 'pending',
          accountName: conn.account_name || 'GA4 Property',
          scopes: tokens.scope?.split(' ') || conn.scopes_granted || [],
        }
      );
      return true;
    } catch (error: any) {
      await connectionRepo.markConnectionError(clientId, this.platform, `Refresh failed: ${error.message}`);
      return false;
    }
  }

  async fetch(clientId: string, period: ReportPeriod): Promise<FetchResult> {
    const conn = await connectionRepo.getConnection(clientId, this.platform);
    if (!conn) {
      throw new ReportlyError('API_FETCH_FAILED', 'Connection not found', 'Please reconnect GA4.', 404);
    }

    // Always try refresh for safety or check expiry
    const isExpired = conn.token_expires_at && new Date(conn.token_expires_at) < new Date();
    if (isExpired) {
      const refreshed = await this.refresh(clientId);
      if (!refreshed) {
        throw new ReportlyError('API_FETCH_FAILED', 'Token refresh failed', 'Session expired. Please reconnect.', 401);
      }
    }

    // Re-get connection for fresh token
    const freshConn = await connectionRepo.getConnection(clientId, this.platform);
    if (!freshConn || !freshConn.account_id || freshConn.account_id === 'pending') {
      throw new ReportlyError('API_FETCH_FAILED', 'GA4 Property ID not configured', 'Account configuration missing.', 400);
    }

    const startDate = period.start.toISOString().split('T')[0];
    const endDate = period.end.toISOString().split('T')[0];

    const rawData = await fetchGA4Data(
      freshConn.account_id,
      freshConn.access_token,
      startDate,
      endDate
    );

    const metrics = transformGA4Response(rawData, period.start, period.end);

    return {
      raw: rawData as any,
      metrics,
      retrievedAt: new Date(),
      platform: this.platform,
      periodStart: period.start,
      periodEnd: period.end,
    };
  }

  async isConnected(clientId: string): Promise<boolean> {
    return await connectionRepo.isConnected(clientId, this.platform);
  }

  async disconnect(clientId: string): Promise<void> {
    await connectionRepo.markConnectionDisconnected(clientId, this.platform);
  }
}
