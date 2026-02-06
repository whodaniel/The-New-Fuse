import {
  BinaryToTextEncoding,
  CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  timingSafeEqual as nodeTimingSafeEqual,
  randomBytes,
} from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
// Removed unused TAG_LENGTH constant
// --- Crypto Utility Module Refactor Plan Implementation ---
// 1. This file is now the single source of cryptographic helpers for the project.
// 2. All direct usages of Node.js 'crypto' in other files should be replaced with these functions.
// 3. If you need to add new cryptographic helpers, add them here and document them.
// 4. If browser support is needed, polyfills or Web Crypto API equivalents should be added here.

const KEY_LENGTH = 32; // For aes-256-gcm

/**
 * Generates a v4 UUID.
 * @returns {string} A new UUID.
 */
export function getUUID(): string {
  return uuidv4();
}

/**
 * Example usage (remove direct crypto usage elsewhere):
 *   import { getUUID, encrypt, decrypt, sha256, hmacSha256, timingSafeEqual } from './cryptoUtils';
 */

/**
 * Generates cryptographically secure random bytes.
 * @param {number} size - The number of bytes to generate.
 * @returns {Buffer} A buffer containing the random bytes.
 */
export function getRandomBytes(size: number): Buffer {
  return randomBytes(size);
}

/**
 * Creates a SHA-256 hash of the input data.
 * @param {string | Buffer} data - The data to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - The output encoding.
 * @returns {string} The hashed data.
 */
export function sha256(data: string | Buffer, encoding: BinaryToTextEncoding = 'hex'): string {
  return createHash('sha256').update(data).digest(encoding);
}

/**
 * Creates an HMAC-SHA256 signature.
 * @param {string | Buffer} data - The data to sign.
 * @param {string | Buffer} key - The secret key.
 * @param {BinaryToTextEncoding} [encoding='hex'] - The output encoding.
 * @returns {string} The HMAC signature.
 */
export function hmacSha256(
  data: string | Buffer,
  key: string | Buffer,
  encoding: BinaryToTextEncoding = 'hex'
): string {
  return createHmac('sha256', key).update(data).digest(encoding);
}

/**
 * Encrypts text using AES-256-GCM.
 * The key must be 32 bytes.
 * @param {string} text - The plaintext to encrypt.
 * @param {Buffer} key - The encryption key (must be 32 bytes).
 * @returns {string} The encrypted string, formatted as 'iv:tag:encryptedData'.
 */
export function encrypt(text: string, key: Buffer): string {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
  }
  const iv = getRandomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM as CipherGCMTypes, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts text encrypted with AES-256-GCM.
 * The key must be 32 bytes.
 * @param {string} encryptedText - The encrypted string, formatted as 'iv:tag:encryptedData'.
 * @param {Buffer} key - The decryption key (must be 32 bytes).
 * @returns {string} The decrypted plaintext.
 */
export function decrypt(encryptedText: string, key: Buffer): string {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
  }
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected "iv:tag:encryptedData".');
  }

  const [ivHex, tagHex, encryptedDataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encryptedData = Buffer.from(encryptedDataHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM as CipherGCMTypes, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * A constant-time string comparison function to prevent timing attacks.
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {boolean} True if the strings are equal.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const aBuff = Buffer.from(a);
  const bBuff = Buffer.from(b);

  // nodeTimingSafeEqual requires buffers of the same length
  if (aBuff.length !== bBuff.length) {
    // We still need to perform a comparison to prevent timing attacks.
    // We can compare `b` against itself, which will take the same amount of time
    // as a successful comparison, but will always fail if lengths are different.
    nodeTimingSafeEqual(bBuff, bBuff);
    return false;
  }

  return nodeTimingSafeEqual(aBuff, bBuff);
}
