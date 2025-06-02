/**
 * Security utilities for The New Fuse Chrome Extension
 * Handles encryption, decryption, and other security-related functions
 */
import { Store } from './store.js';

const IV_LENGTH = 12; // Bytes for AES-GCM IV (must match VS Code extension)
const KEY_ALGORITHM = { name: 'AES-GCM' };

export class SecurityManager {
  private sharedSecret: string | null = null;
  private derivedKey: CryptoKey | null = null;
  private store = Store.getInstance();

  constructor() {
    // Asynchronously load and derive key upon instantiation
    this.loadSharedSecret().then(() => this.deriveKeyFromSecret());
  }

  /**
   * Ensure the encryption key is ready for use
   * @returns Promise that resolves when the key is ready
   */
  private async ensureKeyIsReady(): Promise<void> {
    if (!this.derivedKey && this.sharedSecret) {
      await this.deriveKeyFromSecret();
    } else if (!this.sharedSecret) {
      await this.loadSharedSecret();
      if (this.sharedSecret) {
        await this.deriveKeyFromSecret();
      }
    }
    if (!this.derivedKey) {
      console.warn('[SecurityManager] Encryption key is not ready/available.');
    }
  }

  /**
   * Set the shared secret and save it to storage
   * @param secret - Shared secret to use for encryption/decryption
   */
  public async setSharedSecret(secret: string): Promise<void> {
    this.sharedSecret = secret;
    await this.store.set('sharedSecret', secret); // Persist the new secret
    await this.deriveKeyFromSecret(); // Re-derive the key with the new secret
  }

  /**
   * Load the shared secret from storage
   */
  private async loadSharedSecret(): Promise<void> {
    this.sharedSecret = await this.store.get<string>('sharedSecret') || null;
  }

  /**
   * Derive an encryption key from the shared secret
   */
  private async deriveKeyFromSecret(): Promise<void> {
    if (!this.sharedSecret) {
      this.derivedKey = null;
      console.warn('[SecurityManager] Shared secret is not set. Cannot derive key.');
      return;
    }
    try {
      const secretBuffer = new TextEncoder().encode(this.sharedSecret);
      // Using SHA-256 hash of the secret as the key material
      // This matches the VS Code extension's approach
      const keyMaterial = await crypto.subtle.digest('SHA-256', secretBuffer);

      this.derivedKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        KEY_ALGORITHM,
        false, // not extractable
        ['encrypt', 'decrypt']
      );
      console.log('[SecurityManager] Encryption key derived successfully.');
    } catch (error) {
      console.error('[SecurityManager] Error deriving encryption key:', error);
      this.derivedKey = null;
    }
  }

  /**
   * Encrypt a message
   * @param message - Message to encrypt
   * @returns Encrypted message or null if encryption failed
   */
  public async encryptMessage(message: string): Promise<string | null> {
    await this.ensureKeyIsReady();
    if (!this.derivedKey) {
      console.warn('[SecurityManager] Encryption key is not available. Cannot encrypt message.');
      // It's crucial that the caller (WebSocketManager) checks for null
      // and decides not to send, or to send an error, or handle accordingly.
      return null; // Indicate encryption failure
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encodedMessage = new TextEncoder().encode(message);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { ...KEY_ALGORITHM, iv: iv },
        this.derivedKey,
        encodedMessage
      );

      // Convert IV and ciphertext to hex strings
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

      // The encryptedBuffer contains both ciphertext and tag in AES-GCM
      const encryptedArray = new Uint8Array(encryptedBuffer);

      // AES-GCM typically appends a 16-byte (128-bit) tag
      const tagLengthBytes = 16;
      const dataLength = encryptedArray.length - tagLengthBytes;

      // Separate data and tag to match VS Code's format
      const dataHex = Array.from(encryptedArray.slice(0, dataLength))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const tagHex = Array.from(encryptedArray.slice(dataLength))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      // Return in the format expected by VS Code
      return JSON.stringify({ iv: ivHex, data: dataHex, tag: tagHex });
    } catch (error) {
      console.error('[SecurityManager] Encryption failed:', error);
      return null; // Indicate encryption failure
    }
  }

  /**
   * Decrypt a message
   * @param encryptedPayload - Encrypted message
   * @returns Decrypted message or null if decryption failed
   */
  public async decryptMessage(encryptedPayload: string): Promise<string | null> {
    await this.ensureKeyIsReady();

    // If it's not JSON, it's probably not encrypted
    try { JSON.parse(encryptedPayload); } catch (e) { return encryptedPayload; }

    if (!this.derivedKey) {
      console.warn('[SecurityManager] Decryption key is not available.');
      return null; // Cannot decrypt if key is missing
    }

    try {
      const { iv: ivHex, data: dataHex, tag: tagHex } = JSON.parse(encryptedPayload);
      if (!ivHex || !dataHex || !tagHex) {
        console.warn('[SecurityManager] Encrypted payload missing iv, data, or tag. Assuming unencrypted or malformed.');
        return encryptedPayload; // Return as is
      }

      // Convert hex strings to Uint8Arrays
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));

      // Combine data and tag for Web Crypto API
      const dataWithTagHex = dataHex + tagHex;
      const dataWithTag = new Uint8Array(dataWithTagHex.match(/.{1,2}/g)!
        .map((byte: string) => parseInt(byte, 16)));

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { ...KEY_ALGORITHM, iv: iv },
        this.derivedKey,
        dataWithTag
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.warn('[SecurityManager] Decryption failed:', error);
      return null;
    }
  }

  public async isKeyReady(): Promise<boolean> {
    await this.ensureKeyIsReady();
    return !!this.derivedKey;
  }

  /**
   * Sanitize code to prevent XSS
   * @param code - Code to sanitize
   * @returns Sanitized code
   */
  public sanitizeCode(code: string): string {
    // Basic sanitization - in a production environment, use a library like DOMPurify
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Keep the original utilities for backward compatibility
export const securityUtils = {
  /**
   * Validate a JWT token
   * @param token - JWT token to validate
   * @returns Whether the token is valid
   */
  validateToken(token: string): boolean {
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Check expiration
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= exp) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },

  /**
   * Sanitize input to prevent XSS
   * @param input - Input to sanitize
   * @returns Sanitized input
   */
  sanitizeInput(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return input.replace(/[&<>"']/g, m => map[m]);
  }
};
