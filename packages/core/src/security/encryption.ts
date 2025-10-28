import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY || 'default-super-secret-key-for-dev';
    if (secret.length < 32) {
      this.logger.warn('Encryption key is less than 32 characters. This is not secure for production.');
    }
    this.key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  }

  encrypt(text: string): { iv: string; encryptedData: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return { iv: iv.toString('hex'), encryptedData: encrypted };
    } catch (error) {
      this.logger.error('Encryption failed', error.stack);
      throw new Error('Encryption failed.');
    }
  }

  decrypt(data: { iv: string; encryptedData: string }): string {
    try {
      const iv = Buffer.from(data.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error.stack);
      throw new Error('Decryption failed.');
    }
  }
}
