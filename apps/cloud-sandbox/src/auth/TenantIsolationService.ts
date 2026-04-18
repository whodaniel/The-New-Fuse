/**
 * Tenant Isolation Service
 *
 * Ensures strict isolation between tenants in the cloud sandbox.
 * Manages resource quotas, rate limiting, and tenant-scoped data access.
 */

import type { AuthenticatedUser } from './CloudSandboxAuthGuard';

export interface TenantQuota {
  tenantId: string;
  maxConcurrentExecutions: number;
  maxExecutionsPerHour: number;
  maxExecutionsPerDay: number;
  maxFileSize: number; // bytes
  maxTotalStorage: number; // bytes
  maxBrowserSessions: number;
  tier: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
}

export interface TenantUsage {
  tenantId: string;
  currentExecutions: number;
  executionsLastHour: number;
  executionsLastDay: number;
  currentStorage: number;
  currentBrowserSessions: number;
  lastReset: Date;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  quota?: TenantQuota;
  usage?: TenantUsage;
}

/**
 * Tenant Isolation Service
 */
export class TenantIsolationService {
  private readonly quotas: Map<string, TenantQuota> = new Map();
  private readonly usage: Map<string, TenantUsage> = new Map();
  private readonly executionCounts: Map<string, number[]> = new Map();

  constructor() {
    // Start background cleanup job
    this.startCleanupJob();
  }

  /**
   * Check if tenant can execute an operation
   */
  async checkQuota(
    user: AuthenticatedUser,
    operationType: 'execution' | 'browser' | 'storage',
    resourceSize?: number
  ): Promise<QuotaCheckResult> {
    const quota = this.getOrCreateQuota(user.tenantId, this.getTierFromRole(user.role));
    const usage = this.getOrCreateUsage(user.tenantId);

    // Check concurrent execution limit
    if (operationType === 'execution') {
      if (usage.currentExecutions >= quota.maxConcurrentExecutions) {
        return {
          allowed: false,
          reason: `Tenant ${user.tenantId} has reached max concurrent executions (${quota.maxConcurrentExecutions})`,
          quota,
          usage,
        };
      }

      // Check hourly limit
      if (usage.executionsLastHour >= quota.maxExecutionsPerHour) {
        return {
          allowed: false,
          reason: `Tenant ${user.tenantId} has reached hourly execution limit (${quota.maxExecutionsPerHour})`,
          quota,
          usage,
        };
      }

      // Check daily limit
      if (usage.executionsLastDay >= quota.maxExecutionsPerDay) {
        return {
          allowed: false,
          reason: `Tenant ${user.tenantId} has reached daily execution limit (${quota.maxExecutionsPerDay})`,
          quota,
          usage,
        };
      }
    }

    // Check browser session limit
    if (operationType === 'browser') {
      if (usage.currentBrowserSessions >= quota.maxBrowserSessions) {
        return {
          allowed: false,
          reason: `Tenant ${user.tenantId} has reached max browser sessions (${quota.maxBrowserSessions})`,
          quota,
          usage,
        };
      }
    }

    // Check storage limits
    if (operationType === 'storage' && resourceSize) {
      if (resourceSize > quota.maxFileSize) {
        return {
          allowed: false,
          reason: `File size ${resourceSize} exceeds tenant limit (${quota.maxFileSize})`,
          quota,
          usage,
        };
      }

      if (usage.currentStorage + resourceSize > quota.maxTotalStorage) {
        return {
          allowed: false,
          reason: `Storage limit exceeded for tenant ${user.tenantId}`,
          quota,
          usage,
        };
      }
    }

    return { allowed: true, quota, usage };
  }

  /**
   * Record execution start
   */
  async recordExecutionStart(tenantId: string): Promise<void> {
    const usage = this.getOrCreateUsage(tenantId);
    usage.currentExecutions++;

    // Track execution for rate limiting
    const now = Date.now();
    if (!this.executionCounts.has(tenantId)) {
      this.executionCounts.set(tenantId, []);
    }
    this.executionCounts.get(tenantId)!.push(now);

    // Update hourly and daily counts
    usage.executionsLastHour = this.countExecutionsInWindow(tenantId, 60 * 60 * 1000); // 1 hour
    usage.executionsLastDay = this.countExecutionsInWindow(tenantId, 24 * 60 * 60 * 1000); // 24 hours

    this.usage.set(tenantId, usage);
  }

  /**
   * Record execution end
   */
  async recordExecutionEnd(tenantId: string): Promise<void> {
    const usage = this.getOrCreateUsage(tenantId);
    usage.currentExecutions = Math.max(0, usage.currentExecutions - 1);
    this.usage.set(tenantId, usage);
  }

  /**
   * Record browser session start
   */
  async recordBrowserSessionStart(tenantId: string): Promise<void> {
    const usage = this.getOrCreateUsage(tenantId);
    usage.currentBrowserSessions++;
    this.usage.set(tenantId, usage);
  }

  /**
   * Record browser session end
   */
  async recordBrowserSessionEnd(tenantId: string): Promise<void> {
    const usage = this.getOrCreateUsage(tenantId);
    usage.currentBrowserSessions = Math.max(0, usage.currentBrowserSessions - 1);
    this.usage.set(tenantId, usage);
  }

  /**
   * Update storage usage
   */
  async updateStorageUsage(tenantId: string, delta: number): Promise<void> {
    const usage = this.getOrCreateUsage(tenantId);
    usage.currentStorage = Math.max(0, usage.currentStorage + delta);
    this.usage.set(tenantId, usage);
  }

  /**
   * Get or create tenant quota
   */
  private getOrCreateQuota(tenantId: string, tier: TenantQuota['tier']): TenantQuota {
    let quota = this.quotas.get(tenantId);

    if (!quota) {
      quota = this.createDefaultQuota(tenantId, tier);
      this.quotas.set(tenantId, quota);
    }

    return quota;
  }

  /**
   * Get or create tenant usage
   */
  private getOrCreateUsage(tenantId: string): TenantUsage {
    let usage = this.usage.get(tenantId);

    if (!usage) {
      usage = {
        tenantId,
        currentExecutions: 0,
        executionsLastHour: 0,
        executionsLastDay: 0,
        currentStorage: 0,
        currentBrowserSessions: 0,
        lastReset: new Date(),
      };
      this.usage.set(tenantId, usage);
    }

    return usage;
  }

  /**
   * Create default quota based on tier
   */
  private createDefaultQuota(tenantId: string, tier: TenantQuota['tier']): TenantQuota {
    const quotasByTier: Record<TenantQuota['tier'], Omit<TenantQuota, 'tenantId' | 'tier'>> = {
      FREE: {
        maxConcurrentExecutions: 1,
        maxExecutionsPerHour: 10,
        maxExecutionsPerDay: 50,
        maxFileSize: 1024 * 1024, // 1 MB
        maxTotalStorage: 10 * 1024 * 1024, // 10 MB
        maxBrowserSessions: 1,
      },
      BASIC: {
        maxConcurrentExecutions: 3,
        maxExecutionsPerHour: 50,
        maxExecutionsPerDay: 500,
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        maxTotalStorage: 100 * 1024 * 1024, // 100 MB
        maxBrowserSessions: 2,
      },
      STANDARD: {
        maxConcurrentExecutions: 5,
        maxExecutionsPerHour: 200,
        maxExecutionsPerDay: 2000,
        maxFileSize: 50 * 1024 * 1024, // 50 MB
        maxTotalStorage: 1024 * 1024 * 1024, // 1 GB
        maxBrowserSessions: 5,
      },
      PREMIUM: {
        maxConcurrentExecutions: 10,
        maxExecutionsPerHour: 1000,
        maxExecutionsPerDay: 10000,
        maxFileSize: 100 * 1024 * 1024, // 100 MB
        maxTotalStorage: 10 * 1024 * 1024 * 1024, // 10 GB
        maxBrowserSessions: 10,
      },
      ENTERPRISE: {
        maxConcurrentExecutions: 50,
        maxExecutionsPerHour: 10000,
        maxExecutionsPerDay: 100000,
        maxFileSize: 500 * 1024 * 1024, // 500 MB
        maxTotalStorage: 100 * 1024 * 1024 * 1024, // 100 GB
        maxBrowserSessions: 50,
      },
    };

    return {
      tenantId,
      tier,
      ...quotasByTier[tier],
    };
  }

  /**
   * Get tier from user role
   */
  private getTierFromRole(role: string): TenantQuota['tier'] {
    const tierMap: Record<string, TenantQuota['tier']> = {
      SUPER_ADMIN: 'ENTERPRISE',
      ADMIN: 'ENTERPRISE',
      AGENCY_OWNER: 'PREMIUM',
      AGENCY_ADMIN: 'STANDARD',
      AGENCY_MANAGER: 'STANDARD',
      AGENT_OPERATOR: 'BASIC',
      USER: 'FREE',
    };

    return tierMap[role] || 'FREE';
  }

  /**
   * Count executions in time window
   */
  private countExecutionsInWindow(tenantId: string, windowMs: number): number {
    const executions = this.executionCounts.get(tenantId);
    if (!executions) return 0;

    const now = Date.now();
    const cutoff = now - windowMs;

    return executions.filter((timestamp) => timestamp >= cutoff).length;
  }

  /**
   * Start background cleanup job
   */
  private startCleanupJob(): void {
    // Clean up old execution timestamps every 5 minutes
    setInterval(
      () => {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;

        for (const [tenantId, executions] of this.executionCounts.entries()) {
          const cleaned = executions.filter((timestamp) => timestamp >= dayAgo);
          this.executionCounts.set(tenantId, cleaned);
        }

        console.debug('Cleaned up old execution timestamps');
      },
      5 * 60 * 1000
    );
  }

  /**
   * Get tenant usage report
   */
  getTenantUsage(tenantId: string): TenantUsage | undefined {
    return this.usage.get(tenantId);
  }

  /**
   * Get tenant quota
   */
  getTenantQuota(tenantId: string): TenantQuota | undefined {
    return this.quotas.get(tenantId);
  }

  /**
   * Update tenant quota (for admin operations)
   */
  updateTenantQuota(tenantId: string, quota: Partial<TenantQuota>): void {
    const existing = this.quotas.get(tenantId);
    if (existing) {
      this.quotas.set(tenantId, { ...existing, ...quota });
    }
  }

  /**
   * Reset tenant usage (for admin operations)
   */
  resetTenantUsage(tenantId: string): void {
    const usage = this.getOrCreateUsage(tenantId);
    usage.executionsLastHour = 0;
    usage.executionsLastDay = 0;
    usage.currentExecutions = 0;
    usage.currentBrowserSessions = 0;
    usage.lastReset = new Date();
    this.usage.set(tenantId, usage);
    this.executionCounts.set(tenantId, []);
  }
}
