import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { ErrorTrackingService, ErrorCategory, ErrorSeverity } from '../monitoring/ErrorTrackingService.js';

export interface BlockedIpEntry {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface SuspiciousActivityEvent {
  ip: string;
  activityType: string;
  timestamp: Date;
  path?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface IpBlockingConfig {
  enabled: boolean;
  defaultBlockDurationHours: number;
  maxBlockDurationHours: number;
  thresholds: {
    bruteForceAttempts: number;
    rateLimitExceeded: number;
    suspiciousActivities: number;
    timeWindowMinutes: number;
  };
  whitelistedIps: string[];
}

@Injectable()
export class IpBlockingService implements OnModuleInit {
  private readonly logger = new Logger(IpBlockingService.name);
  private config: IpBlockingConfig;
  private suspiciousActivities: Map<string, SuspiciousActivityEvent[]> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly errorTrackingService: ErrorTrackingService
  ) {}

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('security.ipBlocking.enabled', true),
      defaultBlockDurationHours: this.configService.get<number>('security.ipBlocking.defaultBlockDurationHours', 24),
      maxBlockDurationHours: this.configService.get<number>('security.ipBlocking.maxBlockDurationHours', 720), // 30 days
      thresholds: {
        bruteForceAttempts: this.configService.get<number>('security.ipBlocking.thresholds.bruteForceAttempts', 5),
        rateLimitExceeded: this.configService.get<number>('security.ipBlocking.thresholds.rateLimitExceeded', 10),
        suspiciousActivities: this.configService.get<number>('security.ipBlocking.thresholds.suspiciousActivities', 15),
        timeWindowMinutes: this.configService.get<number>('security.ipBlocking.thresholds.timeWindowMinutes', 60)
      },
      whitelistedIps: this.configService.get<string[]>('security.ipBlocking.whitelistedIps', [])
    };

    // Set up event listeners
    this.setupEventListeners();
    
    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupExpiredEntries(), 3600000); // Every hour
    
    // Clean up expired blocks on startup
    await this.cleanupExpiredEntries();
    
    this.logger.info('IP blocking service initialized');
  }

  /**
   * Check if an IP is blocked
   */
  async isBlocked(ip: string): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    // Check whitelist
    if (this.isWhitelisted(ip)) return false;
    
    // Check database
    const blockedIp = await this.prisma.blockedIp.findFirst({
      where: {
        ip,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    return !!blockedIp;
  }

  /**
   * Block an IP address
   */
  async blockIp(
    ip: string,
    reason: string,
    durationHours?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return;
    
    // Don't block whitelisted IPs
    if (this.isWhitelisted(ip)) {
      this.logger.warn(`Attempted to block whitelisted IP: ${ip}`, { reason });
      return;
    }
    
    // Calculate expiration time
    const blockDuration = durationHours || this.config.defaultBlockDurationHours;
    const expiresAt = blockDuration > 0 
      ? new Date(Date.now() + blockDuration * 60 * 60 * 1000)
      : null; // Null means permanent block
    
    try {
      // Check if already blocked
      const existingBlock = await this.prisma.blockedIp.findFirst({
        where: { ip }
      });
      
      if (existingBlock) {
        // Update existing block
        await this.prisma.blockedIp.update({
          where: { id: existingBlock.id },
          data: {
            reason,
            blockedAt: new Date(),
            expiresAt,
            metadata: metadata as any
          }
        });
      } else {
        // Create new block
        await this.prisma.blockedIp.create({
          data: {
            ip,
            reason,
            blockedAt: new Date(),
            expiresAt,
            metadata: metadata as any
          }
        });
      }
      
      this.logger.warn(`Blocked IP address: ${ip}`, { 
        reason, 
        expiresAt: expiresAt?.toISOString() || 'never' 
      });
      
      // Emit event
      this.eventEmitter.emit('security.ipBlocked', {
        ip,
        reason,
        blockedAt: new Date(),
        expiresAt,
        metadata
      });
      
    } catch (error) {
      this.logger.error(`Failed to block IP address: ${ip}`, error);
      this.errorTrackingService.trackError(error as Error, {
        context: { ip, reason },
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.HIGH
      });
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIp(ip: string): Promise<void> {
    try {
      await this.prisma.blockedIp.deleteMany({
        where: { ip }
      });
      
      this.logger.info(`Unblocked IP address: ${ip}`);
      
      // Emit event
      this.eventEmitter.emit('security.ipUnblocked', { ip });
      
    } catch (error) {
      this.logger.error(`Failed to unblock IP address: ${ip}`, error);
      this.errorTrackingService.trackError(error as Error, {
        context: { ip },
        category: ErrorCategory.DATABASE,
        severity: ErrorSeverity.MEDIUM
      });
    }
  }

  /**
   * Record suspicious activity from an IP
   */
  async recordSuspiciousActivity(event: SuspiciousActivityEvent): Promise<void> {
    if (!this.config.enabled) return;
    
    // Don't track whitelisted IPs
    if (this.isWhitelisted(event.ip)) return;
    
    // Check if already blocked
    const isBlocked = await this.isBlocked(event.ip);
    if (isBlocked) return;
    
    // Add to in-memory tracking
    const activities = this.suspiciousActivities.get(event.ip) || [];
    activities.push(event);
    this.suspiciousActivities.set(event.ip, activities);
    
    // Store in database for audit trail
    try {
      await this.prisma.suspiciousActivity.create({
        data: {
          ip: event.ip,
          activityType: event.activityType,
          timestamp: event.timestamp,
          path: event.path,
          userId: event.userId,
          metadata: event.metadata as any
        }
      });
    } catch (error) {
      this.logger.error('Failed to record suspicious activity', error);
    }
    
    // Check if threshold is exceeded
    await this.checkActivityThresholds(event.ip);
  }

  /**
   * Get all currently blocked IPs
   */
  async getBlockedIps(): Promise<BlockedIpEntry[]> {
    try {
      const blockedIps = await this.prisma.blockedIp.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
      
      return blockedIps.map(ip => ({
        ip: ip.ip,
        reason: ip.reason,
        blockedAt: ip.blockedAt,
        expiresAt: ip.expiresAt || undefined,
        metadata: ip.metadata as Record<string, any> || {}
      }));
    } catch (error) {
      this.logger.error('Failed to get blocked IPs', error);
      return [];
    }
  }

  /**
   * Private methods
   */

  private isWhitelisted(ip: string): boolean {
    return this.config.whitelistedIps.includes(ip);
  }

  private async checkActivityThresholds(ip: string): Promise<void> {
    const activities = this.suspiciousActivities.get(ip) || [];
    
    // Filter to recent activities within the time window
    const timeWindowMs = this.config.thresholds.timeWindowMinutes * 60 * 1000;
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentActivities = activities.filter(a => a.timestamp >= cutoff);
    
    // Update the list with only recent activities
    this.suspiciousActivities.set(ip, recentActivities);
    
    // Count by type
    const bruteForceCount = recentActivities.filter(a => a.activityType === 'brute_force').length;
    const rateLimitCount = recentActivities.filter(a => a.activityType === 'rate_limit_exceeded').length;
    const totalCount = recentActivities.length;
    
    // Check thresholds
    if (
      bruteForceCount >= this.config.thresholds.bruteForceAttempts ||
      rateLimitCount >= this.config.thresholds.rateLimitExceeded ||
      totalCount >= this.config.thresholds.suspiciousActivities
    ) {
      // Determine reason
      let reason = 'Multiple suspicious activities';
      if (bruteForceCount >= this.config.thresholds.bruteForceAttempts) {
        reason = 'Brute force attempts';
      } else if (rateLimitCount >= this.config.thresholds.rateLimitExceeded) {
        reason = 'Rate limit repeatedly exceeded';
      }
      
      // Block the IP
      await this.blockIp(ip, reason, this.config.defaultBlockDurationHours, {
        bruteForceCount,
        rateLimitCount,
        totalSuspiciousActivities: totalCount,
        activities: recentActivities.map(a => ({
          type: a.activityType,
          timestamp: a.timestamp,
          path: a.path
        }))
      });
      
      // Clear the activities after blocking
      this.suspiciousActivities.delete(ip);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    try {
      // Remove expired blocks
      const result = await this.prisma.blockedIp.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
      
      if (result.count > 0) {
        this.logger.info(`Cleaned up ${result.count} expired IP blocks`);
      }
      
      // Clean up old suspicious activities
      const oldActivityCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const activityResult = await this.prisma.suspiciousActivity.deleteMany({
        where: {
          timestamp: { lt: oldActivityCutoff }
        }
      });
      
      if (activityResult.count > 0) {
        this.logger.info(`Cleaned up ${activityResult.count} old suspicious activity records`);
      }
      
    } catch (error) {
      this.logger.error('Failed to clean up expired entries', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for brute force attempts
    this.eventEmitter.on('security.bruteForce', (data: { ip: string; path: string; attempts: number }) => {
      this.recordSuspiciousActivity({
        ip: data.ip,
        activityType: 'brute_force',
        timestamp: new Date(),
        path: data.path,
        metadata: { attempts: data.attempts }
      });
    });
    
    // Listen for rate limit exceeded events
    this.eventEmitter.on('security.rateLimitExceeded', (data: { ip: string; path: string }) => {
      this.recordSuspiciousActivity({
        ip: data.ip,
        activityType: 'rate_limit_exceeded',
        timestamp: new Date(),
        path: data.path
      });
    });
  }
}
