/**
 * Encryption Utilities for Database Migrations
 *
 * Provides encryption/decryption functions for sensitive data like API keys
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from password
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}

/**
 * Get encryption password from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY;

  if (!password) {
    throw new Error(
      'Encryption password not found. Set ENCRYPTION_KEY or DATABASE_ENCRYPTION_KEY environment variable.'
    );
  }

  return password;
}

export interface EncryptedData {
  ciphertext: string;
  salt: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyId?: string;
}

/**
 * Encrypt API key or sensitive data
 *
 * @param plaintext - The data to encrypt
 * @param keyId - Optional key ID for key rotation tracking
 * @returns Encrypted data object
 */
export function encryptApiKey(
  plaintext: string,
  keyId?: string
): EncryptedData {
  const password = getEncryptionPassword();

  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive encryption key
  const key = deriveKey(password, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  // Get auth tag for GCM mode
  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM,
    keyId,
  };
}

/**
 * Decrypt API key or sensitive data
 *
 * @param encrypted - The encrypted data object
 * @returns Decrypted plaintext
 */
export function decryptApiKey(encrypted: EncryptedData): string {
  const password = getEncryptionPassword();

  // Parse encrypted data
  const salt = Buffer.from(encrypted.salt, 'base64');
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');

  // Derive decryption key
  const key = deriveKey(password, salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Create hash of API key for verification
 *
 * @param apiKey - The API key to hash
 * @returns Base64 encoded hash
 */
export function hashApiKey(apiKey: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('base64');
}

/**
 * Verify API key against hash
 *
 * @param apiKey - The API key to verify
 * @param hash - The stored hash
 * @returns True if match
 */
export function verifyApiKeyHash(apiKey: string, hash: string): boolean {
  return hashApiKey(apiKey) === hash;
}

/**
 * Migrate plaintext API keys to encrypted format
 *
 * Usage in migration:
 * ```typescript
 * const configs = await drizzle.lLMConfig.findMany();
 * for (const config of configs) {
 *   const encrypted = encryptApiKey(config.apiKey);
 *   await drizzle.lLMConfig.update({
 *     where: { id: config.id },
 *     data: {
 *       apiKeyEncrypted: JSON.stringify(encrypted),
 *       apiKeyHash: hashApiKey(config.apiKey),
 *       encryptionKeyId: 'v1'
 *     }
 *   });
 * }
 * ```
 */
export async function migratePlaintextToEncrypted(
  drizzle: any,
  tableName: string,
  plaintextField: string,
  encryptedField: string,
  hashField?: string
): Promise<number> {
  const records = await drizzle[tableName].findMany({
    where: {
      [plaintextField]: { not: null },
      [encryptedField]: null,
    },
  });

  let migrated = 0;

  for (const record of records) {
    const plaintext = record[plaintextField];
    if (!plaintext || plaintext === 'MIGRATED') continue;

    const encrypted = encryptApiKey(plaintext, 'v1');

    const updateData: any = {
      [encryptedField]: JSON.stringify(encrypted),
      encryptionKeyId: 'v1',
    };

    if (hashField) {
      updateData[hashField] = hashApiKey(plaintext);
    }

    await drizzle[tableName].update({
      where: { id: record.id },
      data: updateData,
    });

    migrated++;
  }

  return migrated;
}

/**
 * Rotate encryption keys
 *
 * Re-encrypts all data with new encryption key
 */
export async function rotateEncryptionKeys(
  drizzle: any,
  tableName: string,
  encryptedField: string,
  oldKeyId: string,
  newKeyId: string
): Promise<number> {
  const records = await drizzle[tableName].findMany({
    where: {
      encryptionKeyId: oldKeyId,
    },
  });

  let rotated = 0;

  for (const record of records) {
    const encryptedData: EncryptedData = JSON.parse(record[encryptedField]);

    // Decrypt with old key
    const plaintext = decryptApiKey(encryptedData);

    // Re-encrypt with new key
    const reencrypted = encryptApiKey(plaintext, newKeyId);

    await drizzle[tableName].update({
      where: { id: record.id },
      data: {
        [encryptedField]: JSON.stringify(reencrypted),
        encryptionKeyId: newKeyId,
        lastKeyRotation: new Date(),
      },
    });

    rotated++;
  }

  return rotated;
}
