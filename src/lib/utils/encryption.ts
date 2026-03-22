import crypto from 'crypto';

/**
 * Encrypts a string payload securely using AES-256-GCM.
 * Requires process.env.ENCRYPTION_KEY to be a 32-byte hex string (64 characters).
 */
export function encryptToken(text: string): { encryptedHex: string; ivHex: string; authTagHex: string } {
  const algorithm = 'aes-256-gcm';
  const secretKeyHex = process.env.ENCRYPTION_KEY;

  if (!secretKeyHex || secretKeyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY environment variable is invalid or missing. Must be 32-byte hex.');
  }

  const key = Buffer.from(secretKeyHex, 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  return {
    encryptedHex: encrypted,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex')
  };
}

/**
 * Decrypts a payload back to its string format.
 */
export function decryptToken(encryptedHex: string, ivHex: string, authTagHex: string): string {
  const algorithm = 'aes-256-gcm';
  const secretKeyHex = process.env.ENCRYPTION_KEY;

  if (!secretKeyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }

  const key = Buffer.from(secretKeyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Packs the payload into a single string for storage.
 * Format: IV:AUTHTAG:ENCRYPTED
 */
export function packEncrypted(text: string): string {
  if (!text) return '';
  const { encryptedHex, ivHex, authTagHex } = encryptToken(text);
  return `${ivHex}:${authTagHex}:${encryptedHex}`;
}

/**
 * Unpacks the single string format back to the raw token.
 */
export function unpackEncrypted(packed: string): string {
  if (!packed) return '';
  const parts = packed.split(':');
  if (parts.length !== 3) throw new Error('Invalid packed encryption format');
  return decryptToken(parts[2], parts[0], parts[1]);
}
