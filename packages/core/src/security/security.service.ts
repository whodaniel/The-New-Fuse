import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly saltRounds = 10;
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    // In a real application, the encryption key should be managed securely
    // (e.g., through a secret manager) and not hardcoded.
    const secret = process.env.ENCRYPTION_KEY || 'default-super-secret-key-for-dev';
    if (secret.length < 32) {
      this.logger.warn('Encryption key is less than 32 characters. This is not secure for production.');
    }
    this.key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  }

  /**
   * Hashes a password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Password hashing failed', error.stack);
      throw new Error('Could not hash password.');
    }
  }

  /**
   * Compares a password with a hash.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error('Password comparison failed', error.stack);
      return false;
    }
  }

  /**
   * Encrypts a string.
   */
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

  /**
   * Decrypts a string.
   */
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

  /**
   * Sanitizes an HTML string to prevent XSS attacks.
   */
  sanitizeHtml(dirtyHtml: string): string {
    return purify.sanitize(dirtyHtml);
  }

  /**
   * Generates a secure random token.
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Audits a security-related event.
   */
  async audit(eventType: string, details: Record<string, any>) {
    this.logger.log(`[AUDIT] Event: ${eventType}`, details);
  }
}
