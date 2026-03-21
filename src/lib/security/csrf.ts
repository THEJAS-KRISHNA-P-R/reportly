import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Generate a signed OAuth state parameter.
 * State contains the payload and a timestamp, signed with HMAC-SHA256.
 * Format: base64url(json|timestamp).signature
 *
 * @param payload - Key-value pairs to embed in the state (e.g., agencyId, clientId)
 * @returns Signed state string for use in OAuth authorize URL
 */
export function generateOAuthState(payload: Record<string, string>): string {
  const secret = getSecret();
  const data = JSON.stringify(payload) + '|' + Date.now();
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + hash;
}

/**
 * Verify an OAuth state parameter.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param state - The state received in the OAuth callback
 * @returns Parsed payload if valid, null if tampered or malformed
 */
export function verifyOAuthState(state: string): Record<string, string> | null {
  const secret = getSecret();
  try {
    const dotIndex = state.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const dataB64 = state.slice(0, dotIndex);
    const receivedHash = state.slice(dotIndex + 1);
    const data = Buffer.from(dataB64, 'base64url').toString();
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    // Constant-time comparison — prevent timing attacks
    if (
      receivedHash.length !== expectedHash.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash))
    ) {
      return null;
    }
    // Parse and validate payload
    const [jsonPart, _timestamp] = data.split('|');
    return JSON.parse(jsonPart) as Record<string, string>;
  } catch {
    return null;
  }
}

/**
 * Generate a PKCE code verifier (random 43-128 char string).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Derive a PKCE code challenge from a verifier using S256 method.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
