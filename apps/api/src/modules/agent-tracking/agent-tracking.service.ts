/**
 * Agent Tracking Service
 * 
 * Manages agent identity, sessions, and reputation tracking:
 * - Store agent metadata: IP, wallet address, first seen, last seen
 * - Build reputation score based on behavior
 * - Check IP against abuse databases (optional)
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { eq, and, desc, gt, lt, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, DrizzleClient } from '@the-new-fuse/database';
import {
  agentTracking,
  agentSessions,
  agentRequestLog,
  AgentTracking,
  NewAgentTracking,
  AgentSession,
  NewAgentSession,
  NewAgentRequestLog,
  ReputationFactors,
  AbuseCheckStatus,
} from '@the-new-fuse/database';
import { randomBytes } from 'crypto';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AgentIdentity {
  agentId: string;
  ipAddress: string;
  tlsFingerprint?: string;
  userAgent?: string;
  walletAddress?: string;
}

export interface SessionConfig {
  agentId: string;
  originIp: string;
  tlsFingerprint?: string;
  userAgent?: string;
  expiresInSeconds?: number;
  metadata?: Record<string, any>;
}

export interface RequestLogEntry {
  agentId: string;
  sessionId?: string;
  trackingId?: string;
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  ipAddress: string;
  statusCode?: number;
  responseTimeMs?: number;
  endpoint?: string;
  action?: string;
  errorType?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ReputationUpdate {
  successfulRequest?: boolean;
  failedRequest?: boolean;
  suspiciousActivity?: boolean;
  abuseReport?: boolean;
  penalty?: number;
  bonus?: number;
}

export interface AbuseCheckResult {
  status: AbuseCheckStatus;
  details?: {
    source: string;
    reasons: string[];
    riskScore: number;
    lastReported?: Date;
  };
}

export interface AbuseCheckerConfig {
  enabled: boolean;
  providers: AbuseCheckProvider[];
  timeoutMs: number;
}

export interface AbuseCheckProvider {
  name: string;
  check(ip: string): Promise<AbuseCheckResult>;
}

// ============================================================================
// DEFAULT ABUSE CHECKER (STUB)
// ============================================================================

/**
 * Default abuse checker that always returns CLEAN
 * Replace with actual implementation integrating with:
 * - AbuseIPDB
 * - Spamhaus
 * - Project Honeypot
 * - Custom blocklists
 */
@Injectable()
export class DefaultAbuseChecker implements AbuseCheckProvider {
  name = 'default';

  async check(ip: string): Promise<AbuseCheckResult> {
    // Stub implementation - always returns CLEAN
    // TODO: Implement actual abuse database checks
    return {
      status: 'CLEAN',
      details: {
        source: this.name,
        reasons: [],
        riskScore: 0,
      },
    };
  }
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AgentTrackingService {
  private readonly logger = new Logger(AgentTrackingService.name);
  private readonly abuseChecker: AbuseCheckProvider;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    @Optional() abuseChecker?: AbuseCheckProvider
  ) {
    this.abuseChecker = abuseChecker || new DefaultAbuseChecker();
  }

  // ===========================================================================
  // AGENT IDENTITY MANAGEMENT
  // ===========================================================================

  /**
   * Record or update agent tracking information
   */
  async recordAgent(identity: AgentIdentity): Promise<AgentTracking> {
    const { agentId, ipAddress, tlsFingerprint, userAgent, walletAddress } = identity;

    // Check if tracking record exists
    const existing = await this.findTrackingByAgentId(agentId);

    if (existing) {
      // Update existing record
      const [updated] = await this.db
        .update(agentTracking)
        .set({
          ipAddress,
          tlsFingerprint: tlsFingerprint || existing.tlsFingerprint,
          userAgent: userAgent || existing.userAgent,
          walletAddress: walletAddress || existing.walletAddress,
          lastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentTracking.agentId, agentId))
        .returning();

      this.logger.debug(`Updated tracking for agent ${agentId}`);
      return updated;
    }

    // Create new tracking record
    const [tracking] = await this.db
      .insert(agentTracking)
      .values({
        agentId,
        ipAddress,
        tlsFingerprint,
        userAgent,
        walletAddress,
        firstSeen: new Date(),
        lastSeen: new Date(),
        reputationScore: 100,
        reputationFactors: {
          successfulRequests: 0,
          failedRequests: 0,
          suspiciousActivity: 0,
          abuseReports: 0,
          lastCalculated: new Date().toISOString(),
        },
        abuseCheckStatus: 'CLEAN',
      } as NewAgentTracking)
      .returning();

    // Run abuse check on first contact IP
    await this.checkIpAddress(tracking.id, ipAddress);

    this.logger.log(`Created tracking record for agent ${agentId} from IP ${ipAddress}`);
    return tracking;
  }

  /**
   * Get tracking information for an agent
   */
  async findTrackingByAgentId(agentId: string): Promise<AgentTracking | undefined> {
    const [tracking] = await this.db
      .select()
      .from(agentTracking)
      .where(eq(agentTracking.agentId, agentId))
      .limit(1);

    return tracking;
  }

  /**
   * Get tracking by IP address
   */
  async findTrackingByIpAddress(ipAddress: string): Promise<AgentTracking[]> {
    return this.db
      .select()
      .from(agentTracking)
      .where(eq(agentTracking.ipAddress, ipAddress));
  }

  /**
   * Get tracking by wallet address
   */
  async findTrackingByWalletAddress(walletAddress: string): Promise<AgentTracking | undefined> {
    const [tracking] = await this.db
      .select()
      .from(agentTracking)
      .where(eq(agentTracking.walletAddress, walletAddress))
      .limit(1);

    return tracking;
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Create a new agent session
   */
  async createSession(config: SessionConfig): Promise<AgentSession> {
    const {
      agentId,
      originIp,
      tlsFingerprint,
      userAgent,
      expiresInSeconds = 3600, // Default 1 hour
      metadata = {},
    } = config;

    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    const [session] = await this.db
      .insert(agentSessions)
      .values({
        sessionId,
        agentId,
        originIp,
        tlsFingerprint,
        userAgent,
        createdAt: now,
        expiresAt,
        lastActivityAt: now,
        isActive: true,
        requestCount: 0,
        errorCount: 0,
        metadata,
      } as NewAgentSession)
      .returning();

    this.logger.log(`Created session ${sessionId} for agent ${agentId} from ${originIp}`);
    return session;
  }

  /**
   * Get session by session ID
   */
  async getSession(sessionId: string): Promise<AgentSession | undefined> {
    const [session] = await this.db
      .select()
      .from(agentSessions)
      .where(eq(agentSessions.sessionId, sessionId))
      .limit(1);

    return session;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.db
      .update(agentSessions)
      .set({
        lastActivityAt: new Date(),
      })
      .where(eq(agentSessions.sessionId, sessionId));
  }

  /**
   * Increment session request count
   */
  async incrementSessionRequests(sessionId: string, isError: boolean = false): Promise<void> {
    await this.db
      .update(agentSessions)
      .set({
        requestCount: sql`${agentSessions.requestCount} + 1`,
        errorCount: isError ? sql`${agentSessions.errorCount} + 1` : agentSessions.errorCount,
        lastActivityAt: new Date(),
      })
      .where(eq(agentSessions.sessionId, sessionId));
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, reason?: string): Promise<void> {
    await this.db
      .update(agentSessions)
      .set({
        isActive: false,
        terminationReason: reason,
      })
      .where(eq(agentSessions.sessionId, sessionId));

    this.logger.log(`Ended session ${sessionId}${reason ? `: ${reason}` : ''}`);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    
    const result = await this.db
      .update(agentSessions)
      .set({
        isActive: false,
        terminationReason: 'expired',
      })
      .where(
        and(
          eq(agentSessions.isActive, true),
          lt(agentSessions.expiresAt, now)
        )
      )
      .returning();

    if (result.length > 0) {
      this.logger.log(`Cleaned up ${result.length} expired sessions`);
    }

    return result.length;
  }

  /**
   * Get active sessions for an agent
   */
  async getActiveSessions(agentId: string): Promise<AgentSession[]> {
    const now = new Date();

    return this.db
      .select()
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.agentId, agentId),
          eq(agentSessions.isActive, true),
          gt(agentSessions.expiresAt, now)
        )
      );
  }

  // ===========================================================================
  // REQUEST LOGGING
  // ===========================================================================

  /**
   * Log a request
   */
  async logRequest(entry: RequestLogEntry): Promise<void> {
    const {
      agentId,
      sessionId,
      trackingId,
      requestId,
      method,
      path,
      userAgent,
      ipAddress,
      statusCode,
      responseTimeMs,
      endpoint,
      action,
      errorType,
      errorMessage,
      metadata = {},
    } = entry;

    await this.db.insert(agentRequestLog).values({
      agentId,
      sessionId,
      trackingId,
      requestId,
      method,
      path,
      userAgent,
      ipAddress,
      statusCode,
      responseTimeMs,
      endpoint,
      action,
      errorType,
      errorMessage,
      timestamp: new Date(),
      metadata,
    } as NewAgentRequestLog);

    // Update session request count
    if (sessionId) {
      const session = await this.getSession(sessionId);
      if (session) {
        await this.incrementSessionRequests(sessionId, !!errorType || (statusCode !== undefined && statusCode >= 400));
      }
    }
  }

  /**
   * Get request logs for an agent
   */
  async getRequestLogs(
    agentId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<typeof agentRequestLog.$inferSelect[]> {
    const { limit = 100, offset = 0, startDate, endDate } = options || {};

    let query = this.db
      .select()
      .from(agentRequestLog)
      .where(eq(agentRequestLog.agentId, agentId))
      .orderBy(desc(agentRequestLog.timestamp))
      .limit(limit)
      .offset(offset);

    // Note: For date filtering, we'd need to use a more complex where clause
    // This is a simplified version

    return query;
  }

  // ===========================================================================
  // REPUTATION MANAGEMENT
  // ===========================================================================

  /**
   * Update agent reputation based on behavior
   */
  async updateReputation(
    agentId: string,
    update: ReputationUpdate
  ): Promise<number> {
    const tracking = await this.findTrackingByAgentId(agentId);
    if (!tracking) {
      this.logger.warn(`No tracking record found for agent ${agentId}`);
      return 0;
    }

    const factors = tracking.reputationFactors as ReputationFactors;
    let scoreChange = 0;

    // Apply updates to factors
    if (update.successfulRequest) {
      factors.successfulRequests += 1;
      scoreChange += 0.1; // Small bonus for successful requests
    }

    if (update.failedRequest) {
      factors.failedRequests += 1;
      scoreChange -= 0.5; // Penalty for failed requests
    }

    if (update.suspiciousActivity) {
      factors.suspiciousActivity += 1;
      scoreChange -= 5; // Significant penalty for suspicious activity
    }

    if (update.abuseReport) {
      factors.abuseReports += 1;
      scoreChange -= 20; // Major penalty for abuse reports
    }

    // Apply direct penalties/bonuses
    if (update.penalty) {
      scoreChange -= update.penalty;
    }

    if (update.bonus) {
      scoreChange += update.bonus;
    }

    factors.lastCalculated = new Date().toISOString();

    // Calculate new score (clamped between 0 and 100)
    const newScore = Math.max(0, Math.min(100, tracking.reputationScore + scoreChange));

    // Update database
    await this.db
      .update(agentTracking)
      .set({
        reputationScore: newScore,
        reputationFactors: factors,
        updatedAt: new Date(),
      })
      .where(eq(agentTracking.id, tracking.id));

    this.logger.debug(
      `Updated reputation for agent ${agentId}: ${tracking.reputationScore} -> ${newScore}`
    );

    return scoreChange;
  }

  /**
   * Get agent reputation
   */
  async getReputation(agentId: string): Promise<{
    score: number;
    factors: ReputationFactors;
  } | null> {
    const tracking = await this.findTrackingByAgentId(agentId);
    if (!tracking) {
      return null;
    }

    return {
      score: tracking.reputationScore,
      factors: tracking.reputationFactors as ReputationFactors,
    };
  }

  /**
   * Calculate reputation score from factors
   */
  calculateReputationScore(factors: ReputationFactors): number {
    const {
      successfulRequests,
      failedRequests,
      suspiciousActivity,
      abuseReports,
    } = factors;

    // Base score starts at 100
    let score = 100;

    // Deduct for failed requests (diminishing impact)
    score -= Math.min(20, failedRequests * 0.5);

    // Deduct for suspicious activity
    score -= Math.min(30, suspiciousActivity * 5);

    // Major deduction for abuse reports
    score -= Math.min(50, abuseReports * 20);

    // Bonus for successful requests (diminishing returns)
    const successBonus = Math.min(10, successfulRequests * 0.05);
    score += successBonus;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  // ===========================================================================
  // ABUSE CHECKING
  // ===========================================================================

  /**
   * Check an IP address against abuse databases
   */
  async checkIpAddress(
    trackingId: string,
    ipAddress: string
  ): Promise<AbuseCheckResult> {
    try {
      const result = await this.abuseChecker.check(ipAddress);

      // Update tracking record with check results
      await this.db
        .update(agentTracking)
        .set({
          abuseCheckStatus: result.status,
          abuseCheckLastRun: new Date(),
          abuseCheckDetails: result.details,
        })
        .where(eq(agentTracking.id, trackingId));

      if (result.status !== 'CLEAN') {
        this.logger.warn(
          `Abuse check for IP ${ipAddress}: ${result.status} - ${
            result.details?.reasons.join(', ') || 'unknown'
          }`
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Abuse check failed for IP ${ipAddress}: ${error}`);
      return {
        status: 'CLEAN', // Default to clean on error
      };
    }
  }

  /**
   * Check if agent is blocked due to abuse
   */
  async isAgentBlocked(agentId: string): Promise<boolean> {
    const tracking = await this.findTrackingByAgentId(agentId);
    if (!tracking) {
      return false;
    }

    return (
      tracking.abuseCheckStatus === 'BLOCKED' ||
      tracking.reputationScore < 10
    );
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(16).toString('hex');
    return `sess_${timestamp}_${random}`;
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(agentId: string): Promise<void> {
    await this.db
      .update(agentTracking)
      .set({
        lastSeen: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentTracking.agentId, agentId));
  }

  /**
   * Get statistics for an agent
   */
  async getAgentStats(agentId: string): Promise<{
    tracking: AgentTracking | undefined;
    activeSessions: number;
    totalRequests: number;
    averageResponseTime: number;
  }> {
    const tracking = await this.findTrackingByAgentId(agentId);
    const sessions = await this.getActiveSessions(agentId);

    // Get request stats (simplified - would need aggregation in production)
    const logs = await this.getRequestLogs(agentId, { limit: 1000 });
    const totalRequests = logs.length;
    const avgResponseTime = logs.reduce(
      (sum, log) => sum + (log.responseTimeMs || 0),
      0
    ) / (totalRequests || 1);

    return {
      tracking,
      activeSessions: sessions.length,
      totalRequests,
      averageResponseTime: Math.round(avgResponseTime),
    };
  }
}
