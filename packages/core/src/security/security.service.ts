import { Injectable } from '@nestjs/common';
import { SecurityError } from '../utils/errors';
import { Logger } from '../utils/logger';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';

export interface SecurityConfig {
  apiKey?: string;
  jwtSecret?: string;
  allowedOrigins?: string[];
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly saltRounds = 10;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly config: SecurityConfig) {}

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Password hashing failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async comparePassword(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch (error) {
      this.logger.error('Password comparison failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  encryptText(text: string): { encryptedData: string; iv: string; authTag: string } {
    try {
      const iv = crypto.randomBytes(12);
      if (!this.config.jwtSecret) {
        throw new Error('JWT secret is not configured');
      }
      const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encryptedData = cipher.update(text, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      return {
        encryptedData,
        iv: iv.toString('hex'),
        authTag,
      };
    } catch (error) {
      this.logger.error('Encryption failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  decryptText(encryptedData: string, iv: string, authTag: string): string {
    try {
      if (!this.config.jwtSecret) {
        throw new Error('JWT secret is not configured');
      }
      const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
      const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  sanitizeInput(input: string): string {
    try {
      return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
        allowedAttributes: {
          a: ['href'],
        },
      });
    } catch (error) {
      this.logger.error('Input sanitization failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  generateToken(length: number): string {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      this.logger.error('Token generation failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
