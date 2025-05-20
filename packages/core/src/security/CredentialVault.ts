import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { LoggingService } from '../services/LoggingService.js';
import * as crypto from 'crypto';

/**
 * Secure storage for integration credentials
 */
@Injectable()
export class CredentialVault {
  private readonly encryptionKey: Buffer;
  private readonly logger: Logger;
  private credentials: Map<string, Record<string, any>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.createLogger('CredentialVault');
    const key = this.configService.get<string>('security.credentialEncryptionKey');
    if (!key) {
      throw new Error('Credential encryption key not configured');
    }
    this.encryptionKey = Buffer.from(key, 'base64');
  }

  /**
   * Store credentials securely for an integration
   */
  async storeCredentials(integrationId: string, credentials: Record<string, any>): Promise<void> {
    try {
      // Encrypt sensitive data before storing
      const encryptedCredentials = this.encryptCredentials(credentials);
      this.credentials.set(integrationId, encryptedCredentials);
      this.logger.info(`Stored credentials for integration: ${integrationId}`);
    } catch (error) {
      this.logger.error(`Failed to store credentials for integration ${integrationId}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve credentials for an integration
   */
  async getCredentials(integrationId: string): Promise<Record<string, any> | undefined> {
    try {
      const encryptedCredentials = this.credentials.get(integrationId);
      if (!encryptedCredentials) {
        return undefined;
      }
      return this.decryptCredentials(encryptedCredentials);
    } catch (error) {
      this.logger.error(`Failed to retrieve credentials for integration ${integrationId}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete stored credentials for an integration
   */
  async deleteCredentials(integrationId: string): Promise<boolean> {
    const result = this.credentials.delete(integrationId);
    if (result) {
      this.logger.info(`Deleted credentials for integration: ${integrationId}`);
    }
    return result;
  }

  /**
   * Check if credentials exist for an integration
   */
  async hasCredentials(integrationId: string): Promise<boolean> {
    return this.credentials.has(integrationId);
  }

  private encryptCredentials(credentials: Record<string, any>): Record<string, any> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(credentials), 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  private decryptCredentials(encryptedData: Record<string, any>): Record<string, any> {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}