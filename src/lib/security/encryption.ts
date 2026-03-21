import crypto from 'crypto';

// AES-256-GCM: provides both confidentiality AND authenticity (tamper detection)
const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte (64-char) hex string');
  }
  return key;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:ciphertext (all hex-encoded).
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format "ivHex:authTagHex:ciphertextHex"
 * @throws ReportlyError if encryption key is not configured
 */
export function encrypt(plaintext: string): string {
  const KEY = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // GCM auth tag — detects tampering
  // Format: iv(hex):authTag(hex):encrypted(hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 * Throws if the ciphertext has been tampered with (auth tag mismatch).
 *
 * @param ciphertext - String in format "ivHex:authTagHex:ciphertextHex"
 * @returns Original plaintext
 * @throws Error if decryption fails or the ciphertext was tampered with
 */
export function decrypt(ciphertext: string): string {
  const KEY = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format — expected iv:authTag:encrypted');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag); // verify authenticity — throws if tampered
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}
