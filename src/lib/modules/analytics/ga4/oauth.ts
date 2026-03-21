import { OAuth2Client } from 'google-auth-library';
import { ReportlyError } from '@/types/errors';

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

export function getOAuth2Client() {
  if (!clientID || !clientSecret || !redirectUri) {
    throw new ReportlyError(
      'AI_FAILED', // Reusing AI_FAILED or similar for configuration errors for now
      'Google OAuth environment variables are missing',
      'Analytics connection configuration error.',
      500
    );
  }
  return new OAuth2Client(clientID, clientSecret, redirectUri);
}

/**
 * Generates a secure Google Auth URL
 * @param state - Encrypted or signed state for CSRF protection
 */
export async function getAuthUrl(state: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Gets refresh token
    scope: ['https://www.googleapis.com/auth/analytics.readonly'],
    state,
    prompt: 'consent', // Ensure we always get a refresh token on reconnect
  });
}

/**
 * Exchanges auth code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refreshes an expired access token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { tokens } = await (oauth2Client as any).refreshAccessToken();
  return tokens;
}
