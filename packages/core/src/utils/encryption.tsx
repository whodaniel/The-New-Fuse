import CryptoJS from 'crypto-js';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';

export class MessageEncryption {
  private readonly key: string;

  constructor(encryptionKey: string) {
    this.key = encryptionKey;
  }

  /**
   * Encrypts a message using AES encryption
   */
  encrypt(message: string): string {
    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = (CryptoJS as any).AES.encrypt(message, this.key, { iv: iv });
      return iv.toString(CryptoJS.enc.Hex) + ':' + encrypted.toString(); // Combine IV and ciphertext
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts a message using AES encryption
   */
  decrypt(encryptedMessage: string): string {
    try {
      const parts = encryptedMessage.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted message format');
      }
      const iv = CryptoJS.enc.Hex.parse(parts[0]);
      const encrypted = parts[1];
      const bytes = (CryptoJS as any).AES.decrypt(encrypted, this.key, { iv: iv });
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error: unknown) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generates a consistent room key based on participants
   */
  generateRoomKey(roomId: string, userIds: string[]): string {
    const sortedUserIds = userIds.sort().join(',');
    const baseString = `${roomId}-${sortedUserIds}`;
    return CryptoJS.SHA256(baseString).toString();
  }
}

// Define KeyPair type
type KeyPair = { publicKey: Buffer; privateKey: Buffer };

export class E2EEncryption {
  private keyPair: KeyPair | null = null;

  /**
   * Initializes E2E encryption with a new key pair
   */
  async initialize(): Promise<void> {
    try {
      this.keyPair = await this.generateKeyPair();
      console.log('E2E Encryption Initialized');
    } catch (error) {
      console.error('E2E initialization error:', error);
      throw new Error('E2E initialization failed');
    }
  }

  /**
   * Generates a new key pair for E2E encryption
   */
  private async generateKeyPair(): Promise<KeyPair> {
     // Using scrypt to derive keys from a password/salt is not standard for key pair generation.
     // A proper implementation would use crypto.generateKeyPairSync or similar.
     // This is a placeholder based on the previous erroneous code.
     const scryptAsync = promisify(scrypt);
     // Using static password/salt for key generation is insecure. Replace with secure random generation.
     const keyBuffer = await scryptAsync('insecure-password-replace-me', 'insecure-salt-replace-me', 64); // Generate 64 bytes
     const publicKey = keyBuffer.slice(0, 32); // Placeholder split
     const privateKey = keyBuffer.slice(32, 64); // Placeholder split
     return { publicKey, privateKey };
  }

  /**
   * Exports the public key in base64 format
   */
  async exportPublicKey(): Promise<string> {
    if (!this.keyPair?.publicKey) {
      throw new Error('E2E encryption not initialized');
    }

    try {
      return this.keyPair.publicKey.toString('base64');
    } catch (error) {
      console.error('Public key export error:', error);
      throw new Error('Public key export failed');
    }
  }

  /**
   * Encrypts a message for a recipient using their public key
   */
  async encrypt(message: string, recipientPublicKey: string): Promise<string> {
    // This implementation assumes symmetric encryption using a key derived from the private key.
    // Proper E2E would use asymmetric encryption (e.g., RSA, ECC).
    if (!this.keyPair?.privateKey) {
       throw new Error('E2E encryption not initialized');
    }
    try {
      // const publicKeyBuffer = Buffer.from(recipientPublicKey, 'base64'); // Recipient key not used in this symmetric placeholder
      // Placeholder symmetric encryption using own private key (INSECURE EXAMPLE)
      const iv = randomBytes(16);
      // Derive a 32-byte key from the private key. Ensure privateKey is long enough.
      const encryptionKey = this.keyPair.privateKey.slice(0, 32);
      const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
      const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`; // Combine IV, auth tag, and ciphertext
    } catch (error) {
      console.error('E2E encryption error:', error);
      throw new Error('E2E encryption failed');
    }
  }

  /**
   * Decrypts a message using the private key
   */
  async decrypt(encryptedMessage: string): Promise<string> {
    if (!this.keyPair?.privateKey) {
      throw new Error('E2E encryption not initialized');
    }

    try {
       const parts = encryptedMessage.split(':');
       if (parts.length !== 3) throw new Error('Invalid encrypted message format');
       const iv = Buffer.from(parts[0], 'hex');
       const authTag = Buffer.from(parts[1], 'hex');
       const encrypted = Buffer.from(parts[2], 'hex');

       // Derive a 32-byte key from the private key. Ensure privateKey is long enough.
       const decryptionKey = this.keyPair.privateKey.slice(0, 32);
       const decipher = createDecipheriv('aes-256-gcm', decryptionKey, iv);
       decipher.setAuthTag(authTag);
       const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
       return decrypted.toString('utf8');
    } catch (error) {
      console.error('E2E decryption error:', error);
      throw new Error('E2E decryption failed');
    }
  }
}

/**
 * Creates an HMAC signature for a message
 */
export const createMessageSignature = (message: string, userId: string): string => {
  // Use a secret key for HMAC, userId alone might not be secure enough
  // Consider using a dedicated secret stored securely
  const secret = `user-secret-${userId}`; // Example secret derivation
  return CryptoJS.HmacSHA256(message, secret).toString();
};

/**
 * Verifies an HMAC signature for a message
 */
export const verifyMessageSignature = (
  message: string,
  signature: string,
  userId: string
): boolean => {
  const computedSignature = createMessageSignature(message, userId);
  // Use constant-time comparison from Node's crypto module
  // Ensure both buffers have the same length before comparison for nodeTimingSafeEqual
  const sigBuffer = Buffer.from(signature);
  const computedSigBuffer = Buffer.from(computedSignature);
  if (sigBuffer.length !== computedSigBuffer.length) {
      return false;
  }
  return nodeTimingSafeEqual(computedSigBuffer, sigBuffer);
};
