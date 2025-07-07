import { BinaryToTextEncoding } from 'crypto';
/**
 * Generates a v4 UUID.
 * @returns {string} A new UUID.
 */
export declare function getUUID(): string;
/**
 * Example usage (remove direct crypto usage elsewhere):
 *   import { getUUID, encrypt, decrypt, sha256, hmacSha256, timingSafeEqual } from './cryptoUtils';
 */
/**
 * Generates cryptographically secure random bytes.
 * @param {number} size - The number of bytes to generate.
 * @returns {Buffer} A buffer containing the random bytes.
 */
export declare function getRandomBytes(size: number): Buffer;
/**
 * Creates a SHA-256 hash of the input data.
 * @param {string | Buffer} data - The data to hash.
 * @param {BinaryToTextEncoding} [encoding='hex'] - The output encoding.
 * @returns {string} The hashed data.
 */
export declare function sha256(data: string | Buffer, encoding?: BinaryToTextEncoding): string;
/**
 * Creates an HMAC-SHA256 signature.
 * @param {string | Buffer} data - The data to sign.
 * @param {string | Buffer} key - The secret key.
 * @param {BinaryToTextEncoding} [encoding='hex'] - The output encoding.
 * @returns {string} The HMAC signature.
 */
export declare function hmacSha256(data: string | Buffer, key: string | Buffer, encoding?: BinaryToTextEncoding): string;
/**
 * Encrypts text using AES-256-GCM.
 * The key must be 32 bytes.
 * @param {string} text - The plaintext to encrypt.
 * @param {Buffer} key - The encryption key (must be 32 bytes).
 * @returns {string} The encrypted string, formatted as 'iv:tag:encryptedData'.
 */
export declare function encrypt(text: string, key: Buffer): string;
/**
 * Decrypts text encrypted with AES-256-GCM.
 * The key must be 32 bytes.
 * @param {string} encryptedText - The encrypted string, formatted as 'iv:tag:encryptedData'.
 * @param {Buffer} key - The decryption key (must be 32 bytes).
 * @returns {string} The decrypted plaintext.
 */
export declare function decrypt(encryptedText: string, key: Buffer): string;
/**
 * A constant-time string comparison function to prevent timing attacks.
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {boolean} True if the strings are equal.
 */
export declare function timingSafeEqual(a: string, b: string): boolean;
