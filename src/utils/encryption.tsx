import { encrypt, decrypt, hmacSha256, timingSafeEqual } from './cryptoUtils';
import { Logger } from './logger.tsx';

const logger = new Logger('Encryption');

interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
}

export class EncryptionService {
  private keyPair: KeyPair | null = null;

  async initialize(): Promise<void> {
    try {
      this.keyPair = await this.generateKeyPair();
    } catch (error) {
      logger.error('E2E initialization error:', error);
      throw error;
    }
  }

  // Key pair generation should use a secure method; placeholder removed.
  private async generateKeyPair(): Promise<KeyPair> {
    throw new Error('Key pair generation not implemented. Use a secure asymmetric algorithm.');
  }

  async exportPublicKey(): Promise<string> {
    if (!this.keyPair?.publicKey) {
      throw new Error('Public key not initialized');
    }
    try {
      return this.keyPair.publicKey.toString('base64');
    } catch (error) {
      logger.error('Public key export error:', error);
      throw error;
    }
  }

  async encrypt(data: Buffer, key: Buffer): Promise<string> {
    try {
      return encrypt(data.toString('utf8'), key);
    } catch (error) {
      logger.error('E2E encryption error:', error);
      throw error;
    }
  }

  async decrypt(encryptedText: string, key: Buffer): Promise<string> {
    try {
      return decrypt(encryptedText, key);
    } catch (error) {
      logger.error('E2E decryption error:', error);
      throw error;
    }
  }

  createMessageSignature(message: string, key: string): string {
    return hmacSha256(message, key);
  }

  verifyMessageSignature(message: string, signature: string, key: string): boolean {
    const computedSignature = this.createMessageSignature(message, key);
    return timingSafeEqual(computedSignature, signature);
  }
}