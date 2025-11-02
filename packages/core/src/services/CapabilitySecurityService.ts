import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as crypto from 'crypto';

export interface CapabilityPermission {
  id: string;
  capabilityId: string;
  userId: string;
  granted: boolean;
  expiresAt?: Date;
}

@Injectable()
export class CapabilitySecurityService {
  private readonly logger = new Logger(CapabilitySecurityService.name);
  private rateLimiters = new Map<string, RateLimiterMemory>();
  private permissions = new Map<string, CapabilityPermission>();

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.initialize();
  }

  private initialize() {
    const key = this.config.get<string>('CAPABILITY_ENCRYPTION_KEY') || 'default-key';
    this.logger.log('CapabilitySecurityService initialized');
  }

  async validateAccess(userId: string, capabilityId: string): Promise<boolean> {
    try {
      const permission = this.permissions.get(`${userId}-${capabilityId}`);
      if (!permission) {
        this.logger.warn('No permission found', { userId, capabilityId });
        return false;
      }

      if (!permission.granted) {
        return false;
      }

      if (permission.expiresAt && permission.expiresAt < new Date()) {
        return false;
      }

      // Check rate limit
      const rateLimiter = this.rateLimiters.get(capabilityId) || new RateLimiterMemory({
        points: 100,
        duration: 60
      });

      try {
        await rateLimiter.consume(userId);
        return true;
      } catch (error: any) {
        if (error.name === 'RateLimiterRes') {
          this.logger.warn('Rate limit exceeded', { userId, capabilityId });
          return false;
        }
        throw error;
      }
    } catch (error) {
      this.logger.error('Access validation failed', error);
      return false;
    }
  }

  async grantPermission(permission: Omit<CapabilityPermission, 'id'>): Promise<CapabilityPermission> {
    const id = crypto.randomUUID();
    const fullPermission: CapabilityPermission = { ...permission, id };
    this.permissions.set(`${permission.userId}-${permission.capabilityId}`, fullPermission);
    return fullPermission;
  }

  async revokePermission(userId: string, capabilityId: string): Promise<boolean> {
    const key = `${userId}-${capabilityId}`;
    return this.permissions.delete(key);
  }

  async encryptMessage(message: any): Promise<string> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  async decryptMessage(encrypted: string): Promise<any> {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted.toString('utf8'));
  }

  async signToken(payload: any): Promise<string> {
    try {
      return this.jwtService.sign(payload);
    } catch (error) {
      this.logger.error('Token signing failed', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw error;
    }
  }
}
