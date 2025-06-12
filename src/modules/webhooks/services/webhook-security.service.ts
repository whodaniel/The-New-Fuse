import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhookSecurityConfig } from '@the-new-fuse/types';

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);

  async validateSignature(
    payload: string,
    signature: string,
    config: WebhookSecurityConfig,
  ): Promise<boolean> {
    try {
      const expectedSignature = this.generateSignature(payload, config.secret, config.algorithm);
      
      // Handle different signature formats
      const normalizedSignature = this.normalizeSignature(signature, config.algorithm);
      const normalizedExpected = this.normalizeSignature(expectedSignature, config.algorithm);

      // Use timing-safe comparison to prevent timing attacks
      return this.timingSafeEqual(normalizedSignature, normalizedExpected);
    } catch (error) {
      this.logger.error('Failed to validate webhook signature', error);
      return false;
    }
  }

  private generateSignature(payload: string, secret: string, algorithm: 'sha256' | 'sha1'): string {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload, 'utf8');
    return hmac.digest('hex');
  }

  private normalizeSignature(signature: string, algorithm: 'sha256' | 'sha1'): string {
    // Remove common prefixes
    const cleanSignature = signature
      .replace(/^sha256=/, '')
      .replace(/^sha1=/, '')
      .replace(/^v1,/, '') // Stripe format
      .toLowerCase();

    return cleanSignature;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  validateStripeSignature(payload: string, signature: string, secret: string, tolerance: number = 300): boolean {
    try {
      const elements = signature.split(',');
      const signatureHash = elements.find(element => element.startsWith('v1='))?.substring(3);
      const timestamp = elements.find(element => element.startsWith('t='))?.substring(2);

      if (!signatureHash || !timestamp) {
        return false;
      }

      // Check timestamp tolerance
      const timestampNum = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      
      if (Math.abs(now - timestampNum) > tolerance) {
        this.logger.warn('Stripe webhook timestamp outside tolerance');
        return false;
      }

      // Verify signature
      const expectedSignature = this.generateSignature(`${timestamp}.${payload}`, secret, 'sha256');
      return this.timingSafeEqual(signatureHash, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Stripe signature', error);
      return false;
    }
  }

  validateHubSpotSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload + secret, '', 'sha256');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate HubSpot signature', error);
      return false;
    }
  }

  validateSalesforceSignature(payload: string, signature: string, secret: string, url: string): boolean {
    try {
      const data = payload + url;
      const expectedSignature = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Salesforce signature', error);
      return false;
    }
  }

  validatePayPalSignature(
    payload: string,
    headers: Record<string, string>,
    webhookId: string,
    secret: string,
  ): boolean {
    try {
      const authAlgo = headers['paypal-auth-algo'] || 'SHA256withRSA';
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];

      if (!transmission || !certId || !transmissionSig || !timestamp) {
        return false;
      }

      // For simplified validation, we'll use HMAC approach
      // In production, you'd want to use PayPal's SDK for proper RSA validation
      const expectedData = `${authAlgo}|${transmission}|${certId}|${timestamp}|${webhookId}|${crypto.createHash('sha256').update(payload).digest('base64')}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(expectedData, 'utf8').digest('base64');
      
      return this.timingSafeEqual(transmissionSig, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate PayPal signature', error);
      return false;
    }
  }

  validateSquareSignature(payload: string, signature: string, secret: string, url: string): boolean {
    try {
      const data = url + payload;
      const expectedSignature = crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Square signature', error);
      return false;
    }
  }

  validatePipedriveSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha1', secret).update(payload, 'utf8').digest('hex');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Pipedrive signature', error);
      return false;
    }
  }

  validateQuickBooksSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate QuickBooks signature', error);
      return false;
    }
  }

  validateZapierSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Zapier signature', error);
      return false;
    }
  }

  validateWorkatoSignature(payload: string, signature: string, secret: string, timestamp: string): boolean {
    try {
      const data = `${timestamp}.${payload}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
      const formattedSignature = `v1=${expectedSignature}`;
      return this.timingSafeEqual(signature, formattedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Workato signature', error);
      return false;
    }
  }

  validatePowerAutomateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
      return this.timingSafeEqual(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Failed to validate Power Automate signature', error);
      return false;
    }
  }

  generateWebhookSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  encryptSecret(secret: string, key: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Failed to encrypt secret', error);
      throw error;
    }
  }

  decryptSecret(encryptedSecret: string, key: string): string {
    try {
      const [ivHex, encrypted] = encryptedSecret.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt secret', error);
      throw error;
    }
  }

  validateTimestamp(timestamp: string | number, tolerance: number = 300): boolean {
    try {
      const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      const now = Math.floor(Date.now() / 1000);
      return Math.abs(now - timestampNum) <= tolerance;
    } catch (error) {
      this.logger.error('Failed to validate timestamp', error);
      return false;
    }
  }

  sanitizePayload(payload: any): any {
    // Remove potentially dangerous properties
    const sanitized = JSON.parse(JSON.stringify(payload));
    
    // Remove common XSS vectors
    if (typeof sanitized === 'object' && sanitized !== null) {
      this.recursiveSanitize(sanitized);
    }
    
    return sanitized;
  }

  private recursiveSanitize(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS protection
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.recursiveSanitize(obj[key]);
      }
    }
  }

  validatePayloadSize(payload: string, maxSize: number = 1024 * 1024): boolean {
    // Default max size: 1MB
    const payloadSize = Buffer.byteLength(payload, 'utf8');
    return payloadSize <= maxSize;
  }

  rateLimitCheck(identifier: string, windowMs: number = 60000, maxRequests: number = 100): boolean {
    // Simple in-memory rate limiting
    // In production, use Redis or similar distributed cache
    const now = Date.now();
    const key = `webhook_rate_limit_${identifier}`;
    
    // This would be implemented with a proper rate limiting solution
    // For now, return true to allow all requests
    return true;
  }
}