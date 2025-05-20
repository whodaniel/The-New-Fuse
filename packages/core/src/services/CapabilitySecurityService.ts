import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as crypto from 'crypto';

interface CapabilityPermission {
  id: string;
  agentId: string;
  capabilityId: string;
  action: string;
  conditions?: Record<string, any>;
  expiresAt?: Date;
}

interface RateLimitConfig {
  points: number;
  duration: number; // seconds
}

@Injectable()
export class CapabilitySecurityService {
  private logger = new Logger(CapabilitySecurityService.name);
  private encryptionKey: Buffer;
  private rateLimiters = new Map<string, RateLimiterMemory>();
  private defaultRateLimit: RateLimitConfig = {
    points: 100,
    duration: 60
  };

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService
  ) {
    this.initializeEncryption();
    this.setupRateLimiters();
  }

  private initializeEncryption(): void {
    const key = this.config.get<string>('CAPABILITY_ENCRYPTION_KEY');
    if (!key) {
      this.encryptionKey = crypto.randomBytes(32);
      this.logger.warn('No encryption key provided, using random key');
    } else {
      this.encryptionKey = Buffer.from(key, 'hex');
    }
  }

  private setupRateLimiters(): void {
    // Global rate limiter
    this.rateLimiters.set('global', new RateLimiterMemory({
      points: this.config.get('GLOBAL_RATE_LIMIT_POINTS', 1000),
      duration: this.config.get('GLOBAL_RATE_LIMIT_DURATION', 60)
    }));
  }

  async validateAccess(
    agentId: string,
    capabilityId: string,
    action: string
  ): Promise<boolean> {
    try {
      const permission = await this.prisma.capabilityPermission.findFirst({
        where: {
          agentId,
          capabilityId,
          action,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!permission) {
        this.logger.warn(`Access denied for agent ${agentId} to capability ${capabilityId}`);
        return false;
      }

      if (permission.conditions) {
        return this.evaluateConditions(permission.conditions);
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating access:', error);
      return false;
    }
  }

  async checkRateLimit(
    agentId: string,
    capabilityId: string
  ): Promise<boolean> {
    try {
      // Check global rate limit
      await this.rateLimiters.get('global')!.consume(agentId);

      // Check capability-specific rate limit
      const capabilityKey = `${agentId}:${capabilityId}`;
      let limiter = this.rateLimiters.get(capabilityKey);

      if (!limiter) {
        const config = await this.getCapabilityRateLimit(capabilityId);
        limiter = new RateLimiterMemory({
          points: config.points,
          duration: config.duration
        });
        this.rateLimiters.set(capabilityKey, limiter);
      }

      await limiter.consume(agentId);
      return true;
    } catch (error) {
      if (error.name === 'RateLimiterRes') {
        this.logger.warn(`Rate limit exceeded for agent ${agentId} on capability ${capabilityId}`);
        return false;
      }
      this.logger.error('Error checking rate limit:', error);
      return false;
    }
  }

  async grantCapabilityAccess(
    permission: Omit<CapabilityPermission, 'id'>
  ): Promise<CapabilityPermission> {
    return this.prisma.capabilityPermission.create({
      data: {
        ...permission,
        id: crypto.randomUUID()
      }
    });
  }

  encryptMessage(message: any): { encrypted: Buffer; iv: Buffer } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(message), 'utf8'),
      cipher.final()
    ]);

    return { encrypted, iv };
  }

  decryptMessage(encrypted: Buffer, iv: Buffer): any {
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  private async getCapabilityRateLimit(capabilityId: string): Promise<RateLimitConfig> {
    try {
      const capability = await this.prisma.capability.findUnique({
        where: { id: capabilityId },
        select: { rateLimit: true }
      });

      return capability?.rateLimit as RateLimitConfig || this.defaultRateLimit;
    } catch (error) {
      this.logger.error('Error getting capability rate limit:', error);
      return this.defaultRateLimit;
    }
  }

  private evaluateConditions(conditions: Record<string, any>): boolean {
    // Implement condition evaluation logic
    // Examples: time-based conditions, context-based conditions, etc.
    return true;
  }
}