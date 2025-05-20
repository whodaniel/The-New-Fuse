import { createCipheriv, createDecipheriv, createPublicKey, createPrivateKey } from 'crypto';
import { Logger } from './logger.js';
import CryptoJS from 'crypto-js';

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

  private async generateKeyPair(): Promise<KeyPair> {
    const keyBuffer = CryptoJS.lib.WordArray.random(32);
    return {
      publicKey: Buffer.from(keyBuffer.toString(), 'hex'),
      privateKey: Buffer.from(keyBuffer.toString(), 'hex')
    };
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

  async encrypt(data: Buffer, publicKey: Buffer): Promise<Buffer> {
    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      const cipher = createCipheriv('aes-256-gcm', publicKey, iv);
      const encrypted = Buffer.concat([
        iv,
        Buffer.from(cipher.update(data)),
        Buffer.from(cipher.final())
      ]);
      return encrypted;
    } catch (error) {
      logger.error('E2E encryption error:', error);
      throw error;
    }
  }

  async decrypt(data: Buffer, privateKey: Buffer): Promise<Buffer> {
    try {
      const iv = data.subarray(0, 16);
      const encryptedData = data.subarray(16);
      const decipher = createDecipheriv('aes-256-gcm', privateKey, iv);
      return Buffer.concat([
        Buffer.from(decipher.update(encryptedData)),
        Buffer.from(decipher.final())
      ]);
    } catch (error) {
      logger.error('E2E decryption error:', error);
      throw error;
    }
  }

  createMessageSignature(message: string, userId: string): string {
    return CryptoJS.HmacSHA256(message, userId).toString();
  }

  verifyMessageSignature(message: string, signature: string, userId: string): boolean {
    const computedSignature = this.createMessageSignature(message, userId);
    return computedSignature === signature;
  }
}